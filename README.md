# Community Event Management

A full-stack campus event management application for discovering events, registering as a participant, managing events as an organizer, and administering users and categories.

## Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with TypeORM
- Cache: Redis
- Authentication: JWT with bcrypt password hashing

## Project Structure

```text
client/    React/Vite frontend
server/    Express/TypeScript API
```

## Configuration

Create `server/.env`:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=event_management
DB_SYNCHRONIZE=true
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRATION=1d
ADMIN_EMAIL=admin@event-management.local
ADMIN_NAME=Administrator
DEFAULT_ADMIN_PASSWORD=change_this_password
```

Create `client/.env`:

```env
VITE_SERVER_BASE_URL=http://localhost:8080/api
```

Do not commit real passwords, JWT secrets, or production connection details.

## Setup

Install dependencies separately for the client and server. PostgreSQL and Redis must be running, with the default local configuration expecting PostgreSQL on port `5432` and Redis on port `6379`.

```powershell
cd server
npm install

cd ..\client
npm install
```

## Run the Project

Start PostgreSQL and Redis first. Then start the API:

```powershell
cd server
npm run dev
```

In a second terminal, start the frontend:

```powershell
cd client
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

The API is normally available at:

```text
http://localhost:8080/api
```

## Client Routes

The React application uses protected routes based on the authenticated user's role:

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Login and account registration. |
| `/` | Authenticated | Event discovery, search, filtering, and sorting. |
| `/events/:id` | Authenticated | Event details, registration actions, and reviews. |
| `/profile` | Authenticated | View and update the current user's profile. |
| `/my-registrations` | Participant | View registration history and cancel active registrations. |
| `/organizer` | Organizer | Manage owned events, participants, attendance, and reviews. |
| `/organizer/events/new` | Organizer | Open the create-event form. |
| `/admin` | Admin | View administrative dashboard statistics. |
| `/admin/users` | Admin | Filter, ban, and unban users. |
| `/admin/categories` | Admin | Create, rename, and delete event categories. |
| `/admin/orphaned-events` | Admin | Review events whose organizer account was deleted. |

Unknown routes redirect to `/`.

## Main Features

### Participants

- Browse and search events by keyword, category, date range, availability, and sort order
- Register for open events
- Cancel an active registration
- Re-register after cancellation
- View registration history and status
- Receive final registration states of `attended`, `no-show`, or `cancelled`
- Add one review after attending an event
- Edit or delete the participant's review

### Organizers

- Create, edit, and delete events
- Manage event status transitions
- View registered participants
- Mark participants as attended or no-show after an event is closed
- View event reviews with reviewer name, institution, and email

### Administrators

- View users, including banned users
- Filter users by role and joined-date range
- Ban and unban users
- Manage event categories
- View events belonging to deleted organizers
- Access administrative dashboard statistics

## Registration and Review Rules

- Only participants can register for events.
- Registration is available only while an event is open.
- A participant cannot register again after being marked `attended` or `no-show`.
- A cancelled registration remains historical and allows a new registration for the same event.
- Attendance can only be marked after the event is closed.
- `attended`, `no-show`, and `cancelled` are final registration states.
- Only an attended participant can create a review.
- Each participant can have at most one review per event.
- The review owner can edit or delete their review.
- Cancelling an event automatically cancels its active registrations.

## Authentication

`POST /api/auth/login` and `POST /api/auth/register` are public. Other API routes require a JWT bearer token:

```text
Authorization: Bearer <token>
```

Supported roles are:

- `participant`
- `organizer`
- `admin`

## API Overview

The API is grouped into these route areas:

- `/api/auth` - login and registration
- `/api/users` - profiles, bans, and account deletion
- `/api/event-categories` - category management
- `/api/events` - discovery, event management, attendance, and participants
- `/api/event-registrations` - registration operations
- `/api/events/:eventId/reviews` - event reviews
- `/api/event-reviews/:reviewId` - review updates and deletion

For the complete endpoint and request-body reference, see [server/Readme.md](server/Readme.md).

## Data and Security Notes

The server uses TypeORM with `synchronize: true` in the current development configuration. This is convenient for local development but should be replaced with explicit migrations before production deployment.

The first admin account is created from the server environment variables when no admin account exists. Change the default password before using the application outside local development.
