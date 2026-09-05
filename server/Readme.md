# Event Management API

## Running the server

Set the required environment variables (`PORT`, `JWT_SECRET`, database connection variables, and `DEFAULT_ADMIN_PASSWORD`), then run:

```bash
npm install
npm run dev
```

The API base URL is `http://localhost:<PORT>`. All request bodies are JSON.

## Authentication and conventions

- `POST /api/auth/login` and `POST /api/auth/register` are public. Every other `/api/*` endpoint requires `Authorization: Bearer <JWT>`.
- IDs in paths are UUIDs.
- `participant`, `organizer`, and `admin` are the supported roles.
- Fields marked **required** must be supplied. Unless stated otherwise, omitted optional fields are left unchanged.
- Common responses include `400` (invalid request), `401` (missing/invalid token), `403` (insufficient permission), `404` (resource not found), and `500` (server error).

## Endpoint summary

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Public | API welcome message |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/register` | Public | Create an account |
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/me` | Authenticated | Get own profile |
| GET | `/api/users/:id` | Owner or admin | Get a user profile |
| PATCH | `/api/users/:id` | Authenticated | Update own profile |
| DELETE | `/api/users/:id/soft-delete` | Admin | Ban (soft-delete) a user |
| PATCH | `/api/users/:id/unban` | Admin | Restore a banned user |
| DELETE | `/api/users/:id/hard-delete` | Owner | Permanently delete own user |
| GET | `/api/event-categories` | Authenticated | List categories |
| POST | `/api/event-categories` | Admin | Create a category |
| PATCH | `/api/event-categories/:id` | Admin | Rename a category |
| DELETE | `/api/event-categories/:id` | Admin | Delete a category |
| GET | `/api/events` | Authenticated | Search/list events |
| GET | `/api/events/my-events` | Organizer | List the authenticated organizer's events |
| GET | `/api/events/deleted-organizer-events` | Admin | List events whose organizer was deleted |
| GET | `/api/events/:id` | Authenticated | Get one event |
| POST | `/api/events` | Organizer | Create an event |
| PATCH | `/api/events/:id` | Owning organizer; admin only if organizer is deleted | Update an event |
| PATCH | `/api/events/:id/status` | Owning organizer; admin only if organizer is deleted | Change event status |
| DELETE | `/api/events/:id` | Owning organizer; admin only if organizer is deleted | Delete an event |
| GET | `/api/events/:id/participants` | Event manager | List event registrations |
| PATCH | `/api/events/:id/registrations/:registrationId/attendance` | Event manager | Mark attendance |
| POST | `/api/event-registrations` | Participant | Register for an event |
| GET | `/api/event-registrations` | Authenticated | List registrations |
| GET | `/api/event-registrations/:id` | Registration owner, event organizer, or admin | Get a registration |
| DELETE | `/api/event-registrations/:id` | Registration owner or admin | Cancel a registration |
| GET | `/api/events/:eventId/reviews` | Authenticated | List event reviews |
| POST | `/api/events/:eventId/reviews` | Participant who attended | Create a review |
| PATCH | `/api/event-reviews/:reviewId` | Review owner | Update a review |
| DELETE | `/api/event-reviews/:reviewId` | Review owner | Delete a review |

## Authentication

### `POST /api/auth/login`

| Body field | Required | Type | Notes |
| --- | --- | --- | --- |
| `email` | Yes | string | Account email |
| `password` | Yes | string | Account password |

Returns `200` with `{ "token": "<JWT>" }`.

### `POST /api/auth/register`

| Body field | Required | Type | Notes |
| --- | --- | --- | --- |
| `email` | Yes | string | Stored lowercased; must be unique |
| `name` | Yes | string | User display name |
| `password` | Yes | string | Password to hash and store |
| `role` | Yes | string | One of `participant`, `organizer`, or `admin` |
| `institution` | No | string | Participant profile field; used only for `participant` |
| `organization` | No | string | Organizer profile field; used only for `organizer` |

Returns `201` with a success message and JWT token.

## Users

### `GET /api/users`

Admin only. Optional query parameters:

| Query parameter | Type | Notes |
| --- | --- | --- |
| `role` | string | `participant`, `organizer`, or `admin` |
| `created_before` | date/time string | Include users created on or before this value |
| `created_after` | date/time string | Include users created on or after this value |

When both date parameters are sent, they define an inclusive range.

### `GET /api/users/me` and `GET /api/users/:id`

`/me` returns the authenticated user's profile. `:id` is a user UUID and can be requested by that user or an admin.

### `PATCH /api/users/:id`

The implementation updates the authenticated user's record; the `:id` path segment is not used for selecting the record. Supply one or more of the following non-empty strings:

| Body field | Required | Notes |
| --- | --- | --- |
| `name` | No | Updated display name |
| `email` | No | Updated email |
| `password` | No | Re-hashed before storage |

No other body fields are accepted.

### `DELETE /api/users/:id/soft-delete`

Admin only. `:id` is the target user's UUID. An organizer's events are cancelled before the user is soft-deleted. Returns `200`.

### `PATCH /api/users/:id/unban`

Admin only. `:id` is the target user's UUID. Restores a soft-deleted user. For organizers, the `organizer_deleted` flag is cleared on their events; event cancellation status is unchanged. Returns `200`.

### `DELETE /api/users/:id/hard-delete`

Only the user identified by `:id` may permanently delete that account. If the target is an organizer, its events are cancelled and reassigned to a placeholder organizer. Returns `204`.

## Event categories

All category IDs are UUIDs.

| Endpoint | Body requirements |
| --- | --- |
| `GET /api/event-categories` | No parameters |
| `POST /api/event-categories` | **`name`**: non-empty string |
| `PATCH /api/event-categories/:id` | **`name`**: non-empty string |
| `DELETE /api/event-categories/:id` | No body |

Creating, updating, and deleting categories require an admin role. Successful deletion returns `204`.

## Events

### `GET /api/events`

All query parameters are optional.

| Query parameter | Type | Behavior |
| --- | --- | --- |
| `keyword` | string | Case-insensitive match against title or description |
| `category` | string | Case-insensitive exact category-name match |
| `categoryId` | UUID | Filter by category UUID |
| `dateFrom` + `dateTo` | date/time strings | Applies an inclusive date range only when both are present |
| `availability` | string | Only `open` filters to open events; other values are ignored |
| `sort` | string | `event_date`, `title`, `capacity`, or `created_at`; defaults to `event_date` |
| `page` | positive number | Defaults to `1` |
| `limit` | positive number | Defaults to `10`; capped at `50` |

Results are sorted ascending and include `registered_count` for each event.

### `GET /api/events/my-events`

Organizer only. No path, query, or body parameters. Returns all events owned by the authenticated organizer, with `registered_count` (the number of registrations whose status is `registered`) for each event.

### `GET /api/events/deleted-organizer-events`

Admin only. Returns events whose original organizer was deleted.

### `GET /api/events/:id`

`:id` is an event UUID. Returns the event and its `registered_count` when the organizer is active.

### `POST /api/events`

Organizer only.

| Body field | Required | Type | Notes |
| --- | --- | --- | --- |
| `title` | Yes | string | Event title |
| `description` | Yes | string | Event description |
| `eventDate` | Yes | date/time string | Converted to a date |
| `capacity` | Yes | number or numeric string | Converted to a number |
| `location` | Yes | string | Event location |
| `category` | Yes | string | Must exactly match an existing category name |

Returns `201`; the authenticated organizer becomes the event owner.

### `PATCH /api/events/:id`

Event-manager access is required. Send any editable event fields. `status` and `organizer` in the request body are deliberately ignored. If `category` is supplied, it must match an existing category name; it is converted to the associated category ID. Use the status endpoint to change event state.

### `PATCH /api/events/:id/status`

Event-manager access is required.

| Body field | Required | Type | Allowed values |
| --- | --- | --- | --- |
| `status` | Yes | string | `open`, `full`, `closed`, `completed`, `cancelled` |

Only these transitions are accepted:

| Current status | Next status |
| --- | --- |
| `open` | `closed`, `cancelled` |
| `full` | `closed`, `cancelled` |
| `closed` | `cancelled` |
| `completed` | None |
| `cancelled` | None |

### `DELETE /api/events/:id`

Event-manager access is required. No body. Returns `204`.

### `GET /api/events/:id/participants`

Event-manager access is required. No query or body parameters. Returns registrations and participant profile details.

### `PATCH /api/events/:id/registrations/:registrationId/attendance`

Event-manager access is required. Both path values are UUIDs, and the registration must belong to the event.

| Body field | Required | Type | Effect |
| --- | --- | --- | --- |
| `attended` | Yes | boolean | `true` sets `attended`; any falsy value sets `no-show` |

## Event registrations

### `POST /api/event-registrations`

Participant only.

| Body field | Required | Type | Notes |
| --- | --- | --- | --- |
| `eventId` | Yes | UUID | Event must exist and have `open` status |

The participant cannot already have a registration for that event. When the registered count reaches capacity, the event becomes `full`. Returns `201`.

### `GET /api/event-registrations`

| Query parameter | Who uses it | Behavior |
| --- | --- | --- |
| `eventId` | Non-participants | Filters results by event UUID |

Participants always receive only their own registrations, regardless of `eventId`. Organizers and admins can list all registrations when `eventId` is omitted.

### `GET /api/event-registrations/:id`

`:id` is a registration UUID. Available to the registered participant, that event's organizer, or an admin.

### `DELETE /api/event-registrations/:id`

`:id` is a registration UUID. Available to its participant or an admin. Sets the registration status to `cancelled`; a `full` event is reopened. Returns `200`.

## Reviews

### `GET /api/events/:eventId/reviews`

`:eventId` is an event UUID. No query or body parameters. Returns all reviews for that event.

### `POST /api/events/:eventId/reviews`

Only participants with an `attended` registration for the event may create a review.

| Body field | Required | Type | Notes |
| --- | --- | --- | --- |
| `rating` | No | number | Stored as supplied; no application-level range validation |
| `comment` | No | string | Optional review text |

Returns `201`.

### `PATCH /api/event-reviews/:reviewId`

Review owner only. `:reviewId` is a review UUID.

| Body field | Required | Type |
| --- | --- | --- |
| `rating` | No | number |
| `comment` | No | string |

### `DELETE /api/event-reviews/:reviewId`

Review owner only. No body. Returns `204`.
