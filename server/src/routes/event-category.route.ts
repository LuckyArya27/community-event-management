import express from "express";
const router = express.Router();

import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/event-category.controller";

router.get("/", getAllCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;