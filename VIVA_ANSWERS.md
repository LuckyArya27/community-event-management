# Community Event Management — Viva Answers

## 1. Project Introduction and Demo

### Introduce your project and explain what it does

This is a community/campus event-management application. It supports three roles:

- **Participants** can discover events, register, cancel registrations, view their registration history, and review events they attended.
- **Organizers** can create, edit, cancel, and manage events and record attendance.
- **Administrators** can manage users, categories, and events whose organizer account was deleted.

The frontend is a React single-page application. The backend is a REST API using Express, PostgreSQL through TypeORM, Redis caching, JWT authentication, and bcrypt password hashing.

### Give a demo / walk through the application

1. Open `/login` and register as a participant or organizer.
2. As a participant, browse, search, filter, and open event details.
3. Register for an open event and show it in **My Registrations**.
4. As an organizer, create an event, view registered participants, close the event, and mark attendance.
5. As an administrator, show user management, category management, and orphaned-organizer events.

### Code-editor walkthrough

- `client/src/main.jsx` mounts React and wraps the app in `AuthProvider`.
- `client/src/App.jsx` defines public, authenticated, and role-protected client routes.
- `client/src/services/client.js` is the central API client and attaches the bearer token.
- `server/src/index.ts` starts Express, PostgreSQL/TypeORM, Redis, middleware, and routes.
- `server/src/routes/` maps HTTP endpoints to controllers.
- `server/src/controllers/` contains request validation, business rules, and authorization.
- `server/src/dao/` contains TypeORM database queries.
- `server/src/entities/` defines the PostgreSQL tables and relationships.

### Explain the backend and how it works

The backend is Node.js with TypeScript and Express. A normal request travels as follows:

```text
React page → service function → Express route → auth middleware
→ controller → DAO/TypeORM → PostgreSQL → JSON response
```

For example, event registration goes to `POST /api/event-registrations`. The backend verifies the JWT, checks that the user is a participant, verifies that the event is open, checks the registration state, creates a registration, counts active registrations, and marks the event `full` when its capacity is reached.

Redis caches event-search results and user-list results for two minutes. Relevant cache keys are cleared after event and user updates.

### Explain the frontend and how it works

The frontend uses React with React Router and Vite.

- Pages are in `client/src/pages/`.
- Reusable UI components are in `client/src/components/`.
- API calls are in `client/src/services/`.
- `AuthContext` stores the logged-in user and provides login, registration, logout, and user-refresh actions.
- `ProtectedRoute` prevents unauthenticated access and restricts routes by role.

### Languages and frameworks used

| Technology | Role in the project |
| --- | --- |
| TypeScript | Type-safe backend implementation |
| JavaScript/JSX | React frontend implementation |
| Node.js | Backend runtime |
| Express.js | REST API routing and middleware |
| React 19 | Frontend components and state |
| React Router | Client-side routing and protected routes |
| Vite | Frontend development server and build tool |
| Tailwind CSS | Utility-first UI styling |
| PostgreSQL | Relational database |
| TypeORM | Entity mapping and database access |
| Redis | Short-lived caching |
| bcrypt | Password hashing and comparison |
| jsonwebtoken | JWT generation and verification |

## 2. Authentication and Validation

### Explain the authentication flow

1. The user submits login or registration data from `Login.jsx`.
2. The frontend calls `POST /api/auth/login` or `POST /api/auth/register`.
3. For registration, the backend validates required fields and role, checks whether the email exists, hashes the password with bcrypt, creates the user/profile, and signs a JWT.
4. For login, the backend finds the user by email and compares the submitted password to the stored bcrypt hash.
5. The server returns a JWT.
6. The frontend stores it in `localStorage` under `token`.
7. Later API calls send `Authorization: Bearer <token>`.
8. The Express authentication middleware verifies it, puts its payload on `req.user`, and controllers apply role/ownership checks.

### How JWTs are used

The JWT payload contains `user_id`, `name`, and `role`. It is created in `server/src/utils/token.ts` with `jwt.sign()` using `JWT_SECRET`. Its lifetime is configured through `JWT_EXPIRATION`; the sample environment file uses `1d`.

All protected API routes pass through `server/src/middlewares/auth.middleware.ts`. That middleware uses `jwt.verify()` and then puts the verified user payload on `req.user`.

### How Zod is used and where validation happens

**Zod is not used in this project.** There is no Zod dependency or schema-validation layer.

Current validation occurs in two places:

- Frontend HTML validation: `required`, email input type, and an eight-character minimum password length for registration.
- Backend manual validation: controllers check required fields, role values, non-empty values, event status transitions, ownership, and other business rules.

A future improvement would be to validate each request body with Zod at the route/controller boundary before business logic runs.

### Access tokens

The project uses one JWT as its access token. `AuthContext` saves it to browser `localStorage`, and `apiRequest()` reads it and sends it as a bearer token in the authorization header.

### Token refresh mechanism

**Not implemented.** There is no refresh-token endpoint or refresh-token storage. After expiry, the user must log in again.

### Authentication tokens in cookies

**Not implemented.** The current project does not use cookies for authentication; it stores the token in `localStorage`.

For a stronger production design, use a short-lived access token and an `HttpOnly`, `Secure`, `SameSite` refresh-token cookie backed by a database or Redis session record.

### What happens when a JWT expires?

On the next protected request, `jwt.verify()` detects expiry and throws an error. The middleware returns an unauthorized error. During the frontend startup authentication check, `AuthContext` removes the token from `localStorage` on a `401`, clears the current user, and protected routes redirect the user to `/login`.

### How the server knows a JWT expired

JWTs have an `exp` claim. The `jsonwebtoken` library compares that expiry time to the current time inside `jwt.verify()`. An expired token causes verification to fail.

## 4. Database Design and Migrations

### Database migrations

The project uses PostgreSQL through TypeORM. It has **no explicit migration files or migration scripts**. The TypeORM configuration has `synchronize: true`, so TypeORM creates or updates the schema from entity definitions at application startup.

This is convenient for development. For production, use versioned migrations so schema changes are reviewable, repeatable, and reversible.

### Tables and their uses

There are **7 tables**:

| Table | Purpose |
| --- | --- |
| `user` | Core account data, role, password hash, timestamps, and soft-delete state |
| `participant_profiles` | Participant-only data such as institution |
| `organizer_profiles` | Organizer-only data such as organization |
| `event_categories` | Reusable event categories |
| `events` | Event details, capacity, state, category, and organizer |
| `event_registrations` | Participant-to-event registrations and attendance status |
| `event_reviews` | Reviews written by participants for attended events |

### Field data types

- **UUID:** primary keys and foreign-key IDs.
- **varchar/default string:** email, name, title, category name.
- **text:** description, location, organization, institution, comment.
- **integer/number:** capacity and rating.
- **PostgreSQL enum:** user role, event status, registration status.
- **timestamp:** event date and created/updated/deleted timestamps.
- **boolean:** `organizer_deleted`.
- **nullable fields:** optional profile and event information.

### Normalization

The schema is mostly in **Third Normal Form (3NF)**:

- Common user data is separated from participant- and organizer-specific profile data.
- Categories are stored once and referenced by events.
- Registrations represent the many-to-many participant/event relationship.
- Reviews reference an event and participant rather than duplicating their details.
- Registration counts are calculated from registration records rather than stored redundantly on the event.

Suggested improvement: add database-level composite unique constraints on `(event_id, participant_id)` for registrations and reviews. The current application checks these rules, but the database does not enforce them.

### Internal database storage and complexity

PostgreSQL stores table rows in heap files and uses MVCC row versions for concurrent reads and writes. PostgreSQL automatically creates B-tree indexes to enforce primary-key and unique constraints. In this project, those automatic indexes cover UUID primary keys, `user.email`, and `event_categories.name`. The project does not define any additional custom indexes with TypeORM `@Index(...)` decorators or `CREATE INDEX` SQL statements.

- Primary-key/unique equality lookup through a B-tree: `O(log n)`.
- B-tree range query: `O(log n + k)`, where `k` is the number of matching records.
- Indexed insert/update: approximately `O(log n)` for each affected index.
- Unindexed scan/filter: `O(n)`.
- Join, sort, and count complexity depends on PostgreSQL's selected query plan and indexes.

## 5. Concurrency, Race Conditions, and Deadlocks

Express accepts multiple requests concurrently, and database calls are asynchronous. PostgreSQL handles concurrent database access through MVCC and transaction/row-lock mechanisms.

However, this project currently has **no explicit transactions, mutexes, pessimistic locks, optimistic version columns, or Redis distributed locks**.

### Possible race condition: event registration

Two users could read an event as `open`, both see free capacity, both create registrations, and only afterwards update the event to `full`. This can overbook the event. Check-then-insert logic can also allow duplicate registrations or duplicate reviews under simultaneous requests.

### Recommended prevention

Put registration inside one PostgreSQL transaction and lock the event row using `SELECT ... FOR UPDATE`, or TypeORM's pessimistic write lock:

1. Lock and reload the event.
2. Confirm it is still open and capacity remains.
3. Insert the registration.
4. Set the event to `full` if capacity is reached.
5. Commit the transaction.

Also add database unique constraints for registrations and reviews. A database constraint provides the final protection against concurrent duplicate inserts.

### Mutexes and locks

The project currently does not use mutexes or explicit locking mechanisms. PostgreSQL transactions and row-level locks are the appropriate mechanism for cross-request and multi-server database operations.

### Deadlocks

No explicit deadlock handling is implemented. A deadlock could arise after introducing transactions if two operations lock the same rows in different orders—for example, one locks an event then a registration while another locks the registration then the event.

Prevent this by consistently acquiring locks in one order, keeping transactions short, and retrying transactions that PostgreSQL aborts after deadlock detection.

### Leaderboard/points question

**Not applicable:** the project has no leaderboard or points feature.

## 6. Express.js, bcrypt, and Concurrent Requests

Password hashing and comparison use asynchronous `bcrypt.hash()` and `bcrypt.compare()` with 12 salt rounds.

Because these functions are asynchronous, Express can continue processing other requests while bcrypt work is handled through Node.js's worker-thread pool. Bcrypt does not synchronously block the JavaScript event loop in this implementation.

A very high volume of bcrypt requests can exhaust the worker pool and delay other worker-pool work, but it does not freeze the entire Express request handler.

Multiple API requests are handled asynchronously by Express. TypeORM/`pg` database queries are awaited asynchronous operations, and the PostgreSQL driver manages connections through its pool. The project does not define custom pool limits.

## 7. DBMS and ACID Principles

A DBMS manages structured data, queries, constraints, indexes, transactions, concurrent access, permissions, backup, and recovery. This project uses PostgreSQL as its DBMS and TypeORM as its object-relational mapper.

The **C** in ACID means **Consistency**: a committed transaction must move the database from one valid state to another while respecting constraints and business rules.

Current consistency protections include:

- UUID primary keys and foreign-key relationships.
- Unique email and category-name constraints.
- Enum-limited status values.
- Nullability rules.
- Application-level checks for roles, status transitions, capacity, and review eligibility.

PostgreSQL provides ACID guarantees for individual statements and explicit transactions. The project does not yet wrap multi-step workflows—such as registration plus capacity update, user plus profile creation, or event cancellation plus registration cancellation—in one transaction. Full application-level atomicity should therefore be added with transactions.

## 8. Algorithms and Data Structures

### Dynamic programming vs divide and conquer

Dynamic programming solves overlapping subproblems once and stores their results for reuse. Divide and conquer splits a problem into independent subproblems, solves each one, and combines the results.

For example, Fibonacci with memoization is dynamic programming; merge sort is divide and conquer.

### Data structures used in the project

- PostgreSQL relational tables for persistent data.
- UUID keys and foreign-key relationships for identity and associations.
- PostgreSQL-managed B-tree indexes for primary keys and unique fields; no custom indexes are explicitly defined.
- JavaScript arrays for event and registration result sets.
- A JavaScript `Map` to retain the latest registration per event in registration history.
- JavaScript objects/records for grouped registration counts.
- `Promise.all()` to run independent registration-status checks concurrently.
- Redis key-value entries for cached event searches and user lists.

### Heap data structure

A heap is a complete binary tree that follows an ordering rule. In a max-heap, each parent is greater than or equal to its children. In a min-heap, each parent is less than or equal to its children.

The top item is available in `O(1)`, while insertion and removal take `O(log n)`. Heaps are commonly used to implement priority queues.

**Not implemented in this project:** there is no explicit heap data structure in the codebase.

### How does event search work as an algorithm?

The event-discovery page sends optional search parameters such as keyword, category, date range, availability, sort order, page, and limit. The backend builds a TypeORM query step by step:

1. Start with the `events` table and join category/organizer data.
2. Add only the filters provided by the user.
3. Sort using an allowlist of safe sortable fields.
4. Apply pagination with `skip` and `take`.
5. Group active registration counts by event ID and attach each count to its event.

For an unindexed text search such as `ILIKE '%keyword%'`, the worst-case work is `O(n)` over the searched events. Sorting matching records is generally `O(m log m)`, where `m` is the number of matched events. Returning a page is limited by the page size, but offset pagination may become slower for very high page numbers.

### Why is `Map` used for registration history?

The registration-history code can receive multiple historical registrations for one event, such as an old cancelled registration and a later active registration. It uses a JavaScript `Map` keyed by `event_id` to retain the newest registration for every event.

For `n` registration records, iterating through the records is `O(n)`. Average `Map.get()` and `Map.set()` operations are `O(1)`, so the overall deduplication process is `O(n)` time and `O(e)` space, where `e` is the number of distinct events.

### How are registration counts grouped efficiently?

For the event-search page, the backend avoids querying the registration count separately for every event. It sends one grouped database query using `COUNT(*)` and `GROUP BY event_id`, then reduces the returned rows into a JavaScript record:

```text
event_id → registered_count
```

This avoids the N+1 query problem. Instead of up to one count query for every event, the page uses one grouped count query for the displayed event IDs.

### What is the N+1 query problem, and how does this project avoid it in event search?

The N+1 problem occurs when an application runs one query to get a list of `N` records and then one extra query for each record. For example, fetching 10 events and then issuing 10 separate registration-count queries would result in 11 queries.

This project avoids that for event-list counts by using `countRegisteredByEventIds()`, which groups counts for all displayed event IDs in one query. The result is mapped back to each event in memory.

### What is hashing, and where is it used?

Hashing converts input into a fixed-form value. The project uses bcrypt password hashing: passwords are salted and hashed before storage, and bcrypt compares a login attempt against the stored hash.

JavaScript `Map` and object-record lookups also use hash-based lookup behavior internally. Their average lookup, insertion, and update complexity is `O(1)`, though the JavaScript engine manages their exact implementation.

### What is the difference between an array and a Map in this project?

An array is used for ordered collections such as the event cards returned by search. Accessing an array item by numeric index is `O(1)`, but finding an item by ID through a linear scan is `O(n)`.

A `Map` is used when lookup by a key is needed. In registration history, event IDs are keys, which gives average `O(1)` lookup and update while processing records.

### Is binary search used in this project?

No JavaScript binary-search implementation is present. PostgreSQL B-tree indexes use tree-based search internally for indexed lookups, which has approximately `O(log n)` lookup complexity.

Binary search itself requires sorted data and repeatedly halves the search interval, producing `O(log n)` time complexity.

### How does sorting work in the project?

The event-search endpoint allows only a predefined list of sort fields: `event_date`, `title`, `capacity`, `created_at`, and `status`. The backend checks the requested field against an allowlist before passing it to `ORDER BY`.

This is both a correctness and security choice: it provides predictable sort behavior and prevents arbitrary SQL fragments from being inserted through the sort parameter.

Without an index that matches the sort, sorting `m` matched rows is usually `O(m log m)`. A matching database index may reduce the amount of sorting work.

### Which operation is currently the most important DSA/concurrency improvement?

Event registration should become a transaction with a row lock. The current flow is a check-then-insert algorithm, which can race under simultaneous requests. A transaction serializes the critical update for one event, preserving the capacity invariant.

The relevant invariant is:

```text
active registrations for an event ≤ event capacity
```

This is not just a database concern; it is an algorithmic correctness condition that must remain true for every interleaving of concurrent requests.

## 9. Additional Likely Viva Questions and Answers

### What is the difference between authentication and authorization?

Authentication answers **who the user is**. In this project, login verifies the email and bcrypt password hash, then issues a JWT.

Authorization answers **what an authenticated user may do**. The project checks `req.user.role` with `assertRole()` and checks resource ownership with `assertOwnerOrRole()`. For example, only an organizer who owns an event can edit it, while only an administrator can manage categories.

### Why is a password hash stored instead of the password itself?

The database stores `password_hash`, not the original password. Bcrypt converts a password into a one-way salted hash. During login, `bcrypt.compare()` compares the submitted password with the stored hash without recovering the original password.

This reduces the impact of a database leak because plaintext passwords are not stored.

### What information should not be placed in a JWT?

Do not place passwords, password hashes, database secrets, payment information, or other sensitive personal data in a JWT. A signed JWT prevents undetected modification, but its payload can still be decoded by anyone who has it.

This project's token contains only the user ID, name, and role.

### Is JWT authentication stateful or stateless in this application?

It is mainly stateless. The server verifies the signed JWT using `JWT_SECRET` and does not look up a server-side session for every request.

One limitation is that the current implementation has no token denylist or revocation mechanism. If a token is stolen, it remains usable until it expires unless the JWT secret is changed. A future design could include short-lived access tokens, refresh-token rotation, and token/session revocation in Redis or PostgreSQL.

### How are routes protected on both frontend and backend?

Frontend protection is for user experience. `ProtectedRoute` redirects unauthenticated users to `/login` and redirects users without the required role.

Backend protection is the security boundary. Express applies `auth` middleware to protected route groups, verifies the JWT, and controller code checks roles and ownership. A user cannot gain backend permission simply by changing the frontend route.

### What happens if a user changes the token in localStorage manually?

The frontend may send the altered value, but the server verifies the token signature. If it was modified, `jwt.verify()` fails and the request is rejected as unauthorized.

### Why use Redis if PostgreSQL already stores the data?

PostgreSQL is the source of truth and provides durable relational storage. Redis is used as a fast, in-memory cache for frequently requested and short-lived data such as event searches and user lists.

The project caches these values for 120 seconds and clears relevant cache keys after selected event or user writes. Cached data can be temporarily stale, so PostgreSQL is still used for important writes and authoritative checks.

### What is an ORM, and why is TypeORM used?

An ORM, or Object-Relational Mapper, maps program objects/classes to relational database tables. TypeORM maps entity classes such as `User`, `Event`, and `EventRegistration` to PostgreSQL tables, relationships, and queries.

It reduces repetitive SQL for ordinary CRUD work while still allowing query builders for filtering, joins, grouping, and updates.

### What is the difference between soft delete and hard delete in this project?

A soft delete sets the user's `deleted_at` timestamp instead of removing the row. The account can later be restored with the unban endpoint.

A hard delete permanently removes the user row. Before hard-deleting an organizer, the project cancels its events and reassigns them to a placeholder organizer so event records can be retained.

### How do entity relationships work in the schema?

- A user has an optional one-to-one participant profile or organizer profile.
- An organizer has many events.
- A category has many events.
- An event has many registrations and reviews.
- A participant has many registrations and reviews.
- Registrations and reviews each connect one participant to one event.

Foreign keys enforce these relationships, and registration foreign keys use `ON DELETE CASCADE` when their related participant or event is deleted.

### Why are UUIDs used for IDs?

UUIDs are globally unique identifiers. They are difficult to guess compared with sequential numeric IDs and allow IDs to be generated without relying on a single incrementing counter. They do not replace authorization checks; ownership and role validation are still required.

### What is pagination, and how is it implemented?

Pagination limits how many records are returned per response. The event search endpoint accepts `page` and `limit`, applies TypeORM `skip((page - 1) * limit)` and `take(limit)`, defaults to page 1 with a limit of 10, and caps the limit at 50.

For very large datasets, keyset/cursor pagination can be more efficient than offset pagination because large offsets may require PostgreSQL to skip many rows.

### What is an API status code, and which ones does this application use?

- `200 OK`: successful retrieval or update.
- `201 Created`: successful creation, such as registration or account creation.
- `204 No Content`: successful deletion with no response body.
- `400 Bad Request`: invalid input or invalid business action.
- `401 Unauthorized`: missing, invalid, or expired authentication token.
- `403 Forbidden`: authenticated user lacks the required role or ownership.
- `404 Not Found`: requested resource does not exist.
- `500 Internal Server Error`: unexpected server-side failure.

### What improvements would you make before production deployment?

1. Replace `synchronize: true` with versioned TypeORM migrations.
2. Use transactions and row locks for registration and all multi-step writes.
3. Add database unique constraints for one registration/review per participant-event pair as required by the business rules.
4. Add Zod or equivalent schema validation at API boundaries.
5. Use short-lived access tokens, refresh-token rotation, and secure HttpOnly cookies.
6. Configure rate limiting, security headers, structured logging, monitoring, backups, and environment-specific CORS.
7. Add indexes for common event filters and registration lookups after measuring production query patterns.
8. Add automated unit, integration, and concurrency tests.
