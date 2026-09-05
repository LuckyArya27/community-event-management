import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

import { initializeDataSource } from "./config/data-source";
import { findOrCreateFirstAdmin } from "./dao/user.dao";
import { updateEventStatusAtStartUp } from "./dao/event.dao";
import { initiateRedisClient } from "./config/redis-config";
import { auth } from "./middlewares/auth.middleware";
import authRoute from "./routes/authenticate.route";
import userRoute from "./routes/user.route";
import categoryRoute from "./routes/event-category.route";
import eventRoute from "./routes/event.route";
import registrationRoute from "./routes/event-registration.route";
import reviewRoute from "./routes/event-review.route";
import notFoundMiddleware from "./middlewares/not-found.middleware";
import errorHandlerMiddleware from "./middlewares/error-handling.middleware";

(async () => {
  await initializeDataSource();
  await initiateRedisClient();
  await findOrCreateFirstAdmin();
  await updateEventStatusAtStartUp();
  app.use(express.json());
  app.use(cors());
  app.get("/", (req, res) => {
    res.send("Welcome to the Event Management API");
  });

  app.use("/api/auth", authRoute);
  app.use("/api/users", auth, userRoute);
  app.use("/api/event-categories", auth, categoryRoute);
  app.use("/api/events", auth, eventRoute);
  app.use("/api/event-registrations", auth, registrationRoute);
  app.use("/api", auth, reviewRoute);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
