# Banana Brain — Coursework Viva & Technical Defense Documentation
**Module / Assessment:** Distributed Systems / Software Engineering (SFE) — University of Bedfordshire  
**Project Name:** Banana Brain — Distributed Mathematical Reasoning Challenge Platform  
**Target Grade:** First-Class Honours (70%+)  
**Repository:** [github.com/sujalkunwar22/banana](https://github.com/sujalkunwar22/banana.git)  

---

## Table of Contents
1. [1. Version Control](#1-version-control)
2. [2. Event-Driven Architectures](#2-event-driven-architectures)
3. [3. Interoperability](#3-interoperability)
4. [4. Virtual Identity](#4-virtual-identity)
5. [5. Other Interesting Features](#5-other-interesting-features)

---

## 1. Version Control

### Question:
> **How did you develop your code (e.g., what features have been added after first version)?**

### Technical Answer:

The development of **Banana Brain** followed a disciplined, iterative software engineering methodology managed through **Git** version control with a clean, semantic commit history following the [Conventional Commits](https://www.conventionalcommits.org/) specification (`feat:`, `fix:`, `docs:`, `test:`).

#### Phase 1: Baseline Architecture (Version 1.0)
The initial baseline established the complete 3-Tier Distributed System:
- **Presentation Tier**: Semantic HTML5 and Vanilla CSS3 design token system (`public/css/tokens.css`, `base.css`, `components.css`, `layout.css`, `pages.css`) with zero heavy frontend framework dependencies.
- **Application Tier**: Node.js v22+ with Express 5 REST API (`src/app.js`, `src/server.js`) organized in an enterprise architectural pattern: *Routes $\rightarrow$ Middleware $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Repositories $\rightarrow$ Database*.
- **External API Adapter**: Initial implementation of `BananaApiService` (`src/services/banana-api.service.js`) communicating with Dr. Marc Conrad's external puzzle microservice (`https://marcconrad.com/uob/banana/api.php?out=json`).
- **Core Security Invariant**: Implemented server-side solution withholding—ensuring the secret puzzle answer is stored authoritatively in the database and **never** exposed to client-side network payloads or DOM attributes.
- **Relational Persistence**: Zero-configuration embedded SQLite database using Node's native `node:sqlite` (`DatabaseSync`) driver.
- **Virtual Identity**: User registration and login with `bcryptjs` password hashing (10 salt rounds) and `express-session` cookies.
- **Interactive Gameplay**: 180-second visual countdown timer, mathematical puzzle canvas, touch numpad (0–9), keyboard shortcuts, authoritative multi-tier scoring (base points, speed bonus, streak bonus), global leaderboards, and user profile metrics.
- **Automated Verification**: Comprehensive test suite of 24 unit and integration tests across 5 test suites.

```
Commit: e42de19 — feat: complete Banana Brain distributed puzzle platform with full tests and decorated README
```

---

#### Phase 2: Iterative Features & Enhancements (Added After Version 1.0)

Following initial testing and assessment review, three major engineering enhancements were developed:

##### 1. Dual-Mode Relational Database Driver & XAMPP MySQL Support
- **Motivation**: To allow coursework examiners to inspect real-time relational tables directly in **phpMyAdmin** during oral examinations, in addition to zero-config SQLite.
- **Implementation**:
  - Developed the `DatabaseAdapter` pattern (`src/config/database.js`) supporting dynamic switching via `.env` (`DB_DRIVER=sqlite` or `DB_DRIVER=mysql`).
  - Created `src/database/schema-mysql.sql` matching the relational constraints, foreign keys, and indexes of the SQLite schema.
  - Implemented an automated provisioning and migration utility (`scripts/setup-mysql.js`) that connects to `127.0.0.1:3306`, creates the `banana_brain` database, provisions all 5 tables, and seeds default credentials (`demoplayer` / `Banana123!`).
  - Built an automatic graceful failover: if MySQL is unreachable, the application automatically degrades to SQLite without throwing unhandled exceptions.

##### 2. Cross-Database Compatibility & Timezone Synchronization
- **Cross-Dialect SQL**: Replaced SQLite-specific `COLLATE NOCASE` clauses with ANSI SQL standard `WHERE LOWER(username) = LOWER(?)` in `src/repositories/user.repository.js`, ensuring identical case-insensitive username lookups across SQLite, MySQL, and PostgreSQL.
- **Timestamp Precision & Timezone Normalization**:
  - Replaced uninitialized `TIMESTAMP` with `DATETIME NOT NULL` in `src/database/schema-mysql.sql` to satisfy MariaDB strict mode (`NO_ZERO_DATE`).
  - Added session timezone synchronization (`SET time_zone = '+00:00'`) in `mysql2` connection pool initialization. This eliminated timezone disparities between local server time (e.g. Nepal Standard Time UTC+05:45) and UTC `.toISOString()` timestamps, preventing premature puzzle expiration.

##### 3. Cloud Serverless Architecture (Vercel Deployment)
- **Motivation**: Providing a live public HTTPS deployment link alongside local localhost execution.
- **Implementation**:
  - Configured `vercel.json` routing all static assets to `/public` and rewriting `/api/(.*)` to the serverless function handler.
  - Developed `api/index.js` as an exportable serverless function wrapping the Express application factory (`createApp()`).
  - Configured dynamic ephemeral database pathing: on Vercel, the SQLite database automatically mounts to the writable `/tmp/banana_brain.db` partition with `PRAGMA journal_mode = MEMORY`, bypassing serverless read-only filesystem restrictions.
  - Added `app.set('trust proxy', 1)` to correctly resolve upstream HTTPS proxy headers, client IP addresses, and secure cookies.

##### 4. IDE Port Forwarding Stability Fixes
- Added `.vscode/settings.json` configuring `"remote.autoForwardPorts": false` and integrated official `code-tunnel.exe` binaries to resolve environment port-forwarding crashes on Windows.

```
Git Evolution Summary:
├── 10ecaef: Add initial README with project title
├── e42de19: feat: complete Banana Brain distributed puzzle platform with full tests
├── 8ef486d: docs: clean and streamline assessment documentation
├── 5270a15: fix(vercel): configure serverless entrypoint, vercel.json, and safe storage
└── acfad28: fix(database): ensure MySQL compatibility with ANSI case insensitivity, UTC timezone handling, and clean test cleanup
```

---

## 2. Event-Driven Architectures

### Question:
> **What in your code triggers events (e.g., GUI, buttons, timeout …)?**

### Technical Answer:

Banana Brain applies **Event-Driven Architecture (EDA)** across both the **Client Presentation Tier** (browser DOM and UI event bus) and the **Server Application Tier** (Node.js domain event bus), completely decoupling state changes from UI rendering, logging, and metrics calculation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION TIER (Browser)                        │
│                                                                             │
│   [Button Click / 0-9 Key]  ──>  [Client Event Bus]  ──>  [UI Updates]      │
│   [180s Timer Expiration]   ──>  (event-bus.js)      ──>  [Audio Feedback]  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP POST /api/game/challenges/:id/answer
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION TIER (Node.js)                        │
│                                                                             │
│   [Express Controller]  ──>  [Domain Event Bus]  ──>  [Telemetry Logger]    │
│   (game.service.js)          (event-emitter.js)  ──>  [Attempt Audit Log]   │
│                                                  ──>  [Leaderboard Agg.]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### A. Presentation Tier: What Triggers Client Events

#### 1. GUI Buttons & Pointer Events (`public/js/game.js`, `public/js/ui.js`)
- **Numpad Buttons (`0–9`)**: Clicking any virtual key on the on-screen keypad triggers a `click` event listener on `[data-key]`, updating the selected answer preview and dispatching state changes.
- **Submit Button**: Clicking "Submit Guess" (`#btn-submit`) triggers validation, locks the input interface to prevent duplicate submissions, and invokes `apiClient.submitAnswer()`.
- **Action Buttons**: "Play Again", "Next Challenge", "Try Again" buttons trigger game reset routines and challenge loading states.
- **Form Submissions**: Submitting authentication forms (`#form-login`, `#form-register`, `#form-profile`) triggers `submit` event listeners, executing client-side validation before dispatching API requests.
- **Navigation & Modals**: Clicks on modal backdrop overlays (`.modal-backdrop`) or close icons trigger modal dismissal events.

#### 2. Physical Keyboard Interactions (`public/js/game.js`)
- Window-level `keydown` event listener monitors user input:
  - Keys `0` through `9`: Directly selects the corresponding numeric digit.
  - `Enter` / `Space`: Dispatches answer submission if a selection is active.
  - `Backspace` / `Delete`: Clears the currently selected guess.
  - `Escape`: Closes open modals or result overlays.

#### 3. Temporal & Timer Events (`setInterval` & `setTimeout`)
- **180-Second Countdown Clock**: In `game.js`, starting a challenge initiates a 1000ms recurring `setInterval` timer:
  - Every 1 second, it decrements the remaining time, recalculates the CSS progress bar width, and applies color warnings (green $\rightarrow$ amber $\rightarrow$ pulsating red under 30s).
- **Game Timeout Event (`game:timeout`)**: When the timer reaches `0`, it clears the interval and automatically triggers a timeout event. The client marks the challenge expired, disables inputs, displays the timeout modal, and resets the streak counter.
- **Toast Auto-Dismissal**: When a toast notification is created in `ui.js`, a `setTimeout` triggers after 4000ms to smoothly fade out and remove the element from the DOM.

#### 4. Client Event Bus Pub/Sub (`public/js/event-bus.js`)
The client uses a custom publish-subscribe event bus (`clientEventBus`) to decouple network operations from visual components:
- `game:challenge-loaded`: Fired when a new puzzle is fetched; triggers canvas rendering and timer start.
- `game:answer-submitted`: Fired on submission; triggers input disabling and spinner display.
- `game:answer-result`: Fired when verification completes; triggers sound effects, confetti/shake animations, and modal rendering.
- `auth:state-changed`: Fired on login/logout; triggers navbar re-rendering and avatar badge updates.
- `ui:toast`: Fired to display non-intrusive feedback toasts.

---

### B. Application Tier: What Triggers Server Domain Events

On the backend, Banana Brain uses the native Node.js `EventEmitter` (`src/events/event-emitter.js`) with dedicated handlers (`src/events/event-handlers.js`):

| Domain Event Name | Triggering Action & Source File | Handlers / System Actions Executed |
|---|---|---|
| `DOMAIN_EVENTS.CHALLENGE_STARTED` (`challenge.started`) | Triggered in `src/services/game.service.js` when `startChallenge()` successfully fetches an external puzzle. | Logs structured audit telemetry (`challengeId`, `userId`, `startedAt`) to Winston/logger. |
| `DOMAIN_EVENTS.ANSWER_SUBMITTED` (`answer.submitted`) | Triggered in `src/services/game.service.js` when `submitAnswer()` receives an answer payload. | Records response time in milliseconds, logs attempt details, and initiates audit verification. |
| `DOMAIN_EVENTS.CHALLENGE_COMPLETED` (`challenge.completed`) | Triggered in `src/services/game.service.js` after verifying solution correctness. | Inserts permanent record into `game_attempts` table, updates `user_stats` (wins, losses, streaks), and marks challenge completed in DB. |
| `DOMAIN_EVENTS.SCORE_UPDATED` (`score.updated`) | Triggered when points and speed/streak bonuses are awarded. | Emits real-time score updates and recalculates leaderboard aggregates. |
| `DOMAIN_EVENTS.USER_REGISTERED` (`user.registered`) | Triggered in `src/services/auth.service.js` upon new player registration. | Initializes default `user_stats` row and writes security registration audit log. |

---

## 3. Interoperability

### Question:
> **Do you use the API https://marcconrad.com/uob/tomato/api.php? If no, where in your code do you demonstrate interoperability? What protocols do you use?**

### Technical Answer:

#### A. Microservice Selection: Banana API vs Tomato API
**No**, this project does not use the `/uob/tomato/api.php` endpoint. Instead, it interoperates with **Dr. Marc Conrad's Official Banana API** located at:
$$\text{Canonical URL: } \texttt{https://marcconrad.com/uob/banana/api.php?out=json}$$

*(Both the Banana API and Tomato API are microservices architected by Dr. Marc Conrad at the University of Bedfordshire sharing identical JSON schema conventions and algorithmic visual mathematical puzzles. Banana Brain was designed specifically around the Banana API specification as defined in `https://marcconrad.com/uob/banana/doc.php`).*

---

### B. Where Interoperability is Demonstrated in Code

Banana Brain demonstrates interoperability at three distinct system boundaries:

```
┌─────────────────┐       JSON over REST / HTTP Cookies      ┌──────────────────┐
│  Client Browser │ <======================================> │  Express Backend │
└─────────────────┘                [Boundary 1]              └─────────┬────────┘
                                                                       │
                         ┌─────────────────────────────────────────────┴───────────────────────┐
                         │                                                                     │
                         ▼ HTTPS GET (?out=json)                                               ▼ TCP Socket (3306)
             ┌───────────────────────┐                                             ┌───────────────────────┐
             │ Dr. Marc Conrad's     │                                             │ MariaDB / MySQL       │
             │ External Banana API   │                                             │ (XAMPP Daemon)        │
             └───────────────────────┘                                             └───────────────────────┘
                   [Boundary 2]                                                          [Boundary 3]
```

#### Boundary 1: Client $\leftrightarrow$ Server Interoperability (`public/js/api-client.js`)
- Browser-to-backend communication over standard RESTful endpoints.
- Sends and receives UTF-8 encoded JSON payloads with standard HTTP headers (`Accept: application/json`, `Content-Type: application/json`).
- Automatically intercepts and forwards CSRF tokens (`X-CSRF-Token`) and transmits authenticated session cookies (`credentials: 'include'`).

#### Boundary 2: Backend $\leftrightarrow$ External Banana API Microservice (`src/services/banana-api.service.js`)
- Handled by the `BananaApiService` class:
  1. **HTTP 301/302 Redirect Following**: The unencrypted endpoint `http://marcconrad.com/...` returns an HTTP `301 Moved Permanently` directing clients to `https://`. Our outbound client is configured with `redirect: 'follow'` to smoothly traverse redirect chains.
  2. **Timeout Control & Fault Tolerance**: Uses `AbortController` with a configurable 8-second timeout (`env.BANANA_API_TIMEOUT_MS`) to prevent hung upstream connections.
  3. **Schema Contract Validation**: Implements `validateApiResponse(data)` verifying that the external microservice conforms to the contractual schema:
     $$\text{Contract Schema: } \{\; \text{question}: \text{string (URL)}, \;\; \text{solution}: \text{integer } (0 \le x \le 9) \;\}$$
  4. **Offline Resilience & Graceful Degradation**: If Dr. Conrad's external server is temporarily unreachable (e.g. university network maintenance, `AbortError`, or `ENOTFOUND`), the adapter automatically engages pre-configured fallback fixtures (`FALLBACK_PUZZLES`) so the application never crashes.
  5. **Server-Side Secret Stripping**: The backend ingests `{ question, solution }`, stores `solution` safely in the database, and serves **only** `{ id, imageUrl, expiresAt }` to the client.

#### Boundary 3: Backend $\leftrightarrow$ Relational Database Interoperability (`src/config/database.js`)
- Implements a uniform persistence abstraction layer interoperating with:
  - **Embedded SQLite** via native C-level V8 engine bindings (`node:sqlite`).
  - **External MariaDB / MySQL** running in XAMPP via TCP networking sockets on port `3306` using `mysql2`.

---

### C. Protocols and Data Standards Used

| Protocol / Standard | Layer | Usage in Banana Brain |
|---|---|---|
| **HTTPS (TLS 1.3 / 1.2)** | Application / Security | Secure encrypted transit for client requests and outbound calls to `marcconrad.com`. |
| **HTTP/1.1** | Application | Request/response cycles using standard verbs (`GET`, `POST`, `PUT`) and status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`, `410 Gone`). |
| **REST (Representational State Transfer)** | Architectural Style | Stateless endpoint design with predictable resource paths (`/api/auth/*`, `/api/game/*`, `/api/leaderboard`). |
| **JSON (RFC 8259)** | Data Serialization | Universal structured data format for all client-server and microservice interchanges. |
| **MySQL Binary Protocol** | Transport / DB | TCP/IP binary socket protocol communicating with MariaDB daemon on port 3306. |
| **Cookie Protocol (RFC 6265)** | Session / State | Secure stateful tracking across stateless HTTP using signed `Set-Cookie` headers. |
| **DNS Resolution** | Network | Dynamic hostname resolution resolving `marcconrad.com` to host IP addresses. |

---

## 4. Virtual Identity

### Question:
> **How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)**

### Technical Answer:

In **Banana Brain**, Virtual Identity is implemented as an end-to-end security architecture encompassing relational identity persistence, cryptographic credential protection, stateful session lifecycle management, CSRF mitigation, and ownership authorization guards.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VIRTUAL IDENTITY ENGINE                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. Relational Entity │ 2. Cryptography      │ 3. Stateful Session Tokens    │
│    • Unique Username │    • Bcryptjs Salted │    • express-session          │
│    • Email Address   │    • 10 Salt Rounds  │    • HttpOnly (No JS Access)  │
│    • Display Name    │    • Zero Plaintext  │    • SameSite=Lax (Anti-CSRF) │
│    • Avatar Palette  │    • Hash Redaction  │    • Session Regeneration     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 4. Network Security  │ 5. IDOR Ownership    │ 6. Auditing & History         │
│    • IP Rate Limits  │    • user_id Check   │    • Chronological Attempts   │
│    • Brute-Force Blk │    • 403 Forbidden   │    • Win/Loss Audit Trail     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1. Relational Persona & Customization (`users` & `user_stats` Tables)
Virtual identities are stored relationally in the database (`src/database/schema.sql` / `schema-mysql.sql`):
- `username`: Case-insensitive unique handle identifying the player.
- `email`: Unique contact identity for account recovery.
- `display_name`: Human-readable gamer tag shown on leaderboards.
- `bio`: Player biography and self-description.
- `avatar_color`: Personalized hex color palette (e.g., `#F59E0B`, `#3B82F6`, `#10B981`) dynamically rendering the user's avatar icon across the UI.
- `role`: Role-based identity (`player`, `admin`).
- `user_stats`: Direct 1-to-1 relational binding tracking cumulative score, total games, accuracy percentage, and best streaks.

### 2. Cryptographic Password Protection (`src/services/auth.service.js`)
- User passwords are **never** stored in plaintext.
- We utilize industry-standard **salted key derivation** via `bcryptjs`:
  ```javascript
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  ```
- During authentication, `bcrypt.compare()` verifies the candidate password against the stored hash in constant time, preventing timing attacks.
- **Data Redaction Invariant**: All repository queries and controller responses explicitly strip `password_hash` (`delete sanitized.password_hash`) before payloads leave the database boundary.

### 3. Server-Side Session Management & Secure Cookies (`src/app.js`)
- Managed using `express-session` with cryptographically signed cookies:
  ```javascript
  session({
    name: 'banana_brain_sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,                 // Immune to XSS document.cookie theft
      secure: env.COOKIE_SECURE,      // HTTPS-only in production environments
      sameSite: 'lax',                // Mitigates cross-site request forgery
      maxAge: 24 * 60 * 60 * 1000     // 24-hour expiration window
    }
  })
  ```
- **Session Fixation Defense**: Upon successful login, the session is regenerated with `req.session.regenerate()` to issue a brand-new session ID, preventing fixation hijacking.

### 4. Anti-CSRF Token Enforcement (`src/middleware/csrf.middleware.js`)
- Every session is paired with a cryptographically generated anti-CSRF token.
- State-altering endpoints (`POST`, `PUT`, `DELETE`) require the client to supply this token via the `X-CSRF-Token` HTTP header, preventing cross-site forged transactions.

### 5. IP Address Monitoring & Rate Limiting (`src/middleware/rate-limit.middleware.js`)
- Tracks client IP addresses via `req.ip` (with `app.set('trust proxy', 1)` enabled for reverse proxies).
- Applies sliding-window throttling on authentication endpoints:
  - Maximum **10 attempts per 15-minute window** per IP address.
  - Prevents credential stuffing, dictionary attacks, and denial-of-service attempts.

### 6. Anti-IDOR Authorization Guards (`src/services/game.service.js`)
- Protection against **Insecure Direct Object References (IDOR)**:
  ```javascript
  if (challenge.user_id !== userId) {
    const err = new Error('Forbidden: You do not have authorization to answer this challenge');
    err.status = 403;
    throw err;
  }
  ```
- Even if a malicious user guesses another player's challenge UUID, the server verifies that the challenge's `user_id` matches the authenticated session's `req.user.id`, rejecting unauthorized answer attempts with `403 Forbidden`.

### 7. Historical Audit Attribution (`game_attempts` Table)
- Every puzzle challenge attempted is logged with the user's ID, challenge UUID, selected answer, speed/reaction duration, points awarded, and timestamp, providing non-repudiation and a verifiable history of player activity.

---

## 5. Other Interesting Features

### Question:
> **Any other interesting features?**

### Technical Highlights:

Beyond the four foundational coursework themes, **Banana Brain** incorporates several advanced software engineering practices:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STANDOUT ARCHITECTURAL INNOVATIONS                    │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ 1. Anti-Cheat Solution Secrecy    │ 2. Dual Database Driver Architecture    │
│    • Solution stored in DB only   │    • SQLite + XAMPP MySQL Dual Support  │
│    • Stripped before client send  │    • Auto-Failover to Local SQLite      │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ 3. Authoritative Scoring Engine   │ 4. Automated 24-Test Suite (0 Fails)    │
│    • Base + Speed + Streak Bonus  │    • Unit & Integration Coverage        │
│    • Anti-tamper server eval      │    • Deterministic Mock Verification    │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ 5. Resilient Offline Degradation  │ 6. Dark-Mode Vanilla CSS Design System  │
│    • Automatic sample fallbacks   │    • Zero bulky frontend frameworks     │
│    • Zero crashes if API is down  │    • Fluid glassmorphism & accessibility│
└───────────────────────────────────┴─────────────────────────────────────────┘
```

#### 1. Strict Server-Side Solution Secrecy (Anti-Cheat Design)
- **Problem**: Dr. Marc Conrad's Banana API returns `{ question, solution }` simultaneously. In a naive implementation, forwarding this object directly to the frontend allows players to open the browser Developer Tools (Network tab or Console) and view the answer without solving the puzzle.
- **Solution**: The backend intercepts the payload, extracts `solution`, writes it to a server-side record keyed by an unpredictable UUID (`crypto.randomUUID()`), and transmits **only** `{ id, imageUrl, expiresAt }` to the browser. The answer is evaluated strictly on the backend.

#### 2. Dual-Engine Relational Database Driver with Auto-Failover
- **SQLite Engine**: Zero-configuration embedded database via `node:sqlite` for immediate execution during rapid assessment grading.
- **MySQL Engine**: Full XAMPP / MariaDB support via `mysql2` on port 3306 for live table demonstrations in phpMyAdmin.
- **Automatic Fallback**: If MySQL is stopped or misconfigured, `DatabaseAdapter` automatically engages SQLite without throwing fatal server errors.
- **One-Command Setup**: Running `node scripts/setup-mysql.js` automatically provisions the database, applies all relational DDL statements, and seeds demo data in seconds.

#### 3. Dynamic Authoritative Scoring Engine
The scoring formula rewards both mathematical accuracy and cognitive reaction speed:
$$\text{Total Score} = \text{Base Points } (100) + \text{Speed Bonus } (t) + \text{Streak Bonus } (s)$$
- **Base Points**: 100 points for correct solution; 0 points for incorrect.
- **Speed Bonus Tiers**:
  - $< 10\text{ seconds}$: **+50 Points** (Lightning Fast)
  - $10\text{s} \le t < 20\text{s}$: **+30 Points** (Quick Reflexes)
  - $20\text{s} \le t < 30\text{s}$: **+15 Points** (Steady Calculation)
  - $\ge 30\text{ seconds}$: **+0 Points**
- **Consecutive Streak Bonus**: Awards **+10 bonus points** per consecutive correct answer up to a max cap of **+100 points**. Any mistake or timer expiry immediately breaks the streak to 0.

#### 4. Resilient Offline Fallback Fixtures
- Distributed systems must handle third-party service outages gracefully.
- If the external Banana API endpoint suffers university downtime or network partitions, `BananaApiService` automatically engages pre-validated internal puzzle fixtures (`FALLBACK_PUZZLES`). The player sees a smooth notification, gameplay continues uninterrupted, and unit/integration tests pass reliably in offline CI/CD pipelines.

#### 5. 100% Passing Automated Test Suite (24 Tests, 5 Suites)
- Developed using the native Node.js test runner (`node:test`, `node:assert/strict`) and `supertest`:
  1. `tests/unit/scoring.test.js`: Validates base points, speed bonus boundaries, streak calculation, and streak reset logic (6 tests).
  2. `tests/unit/validation.test.js`: Validates API schema contracts, malformed inputs, URL validation, and single-digit boundaries (5 tests).
  3. `tests/integration/auth.test.js`: Validates registration, duplicate rejection, salted password verification, session cookies, and route security (5 tests).
  4. `tests/integration/game-flow.test.js`: Validates solution withholding, IDOR protection, scoring evaluation, anti-cheat replay prevention, and leaderboard updates (5 tests).
  5. `tests/integration/banana-api.test.js`: Validates live API fetching, redirect handling, challenge creation, and offline fixture degradation (3 tests).
- All 24 tests pass in under 3 seconds with **0 failures**.

#### 6. Zero-Framework Dark Mode Presentation Tier
- Built purely with standard semantic HTML5 and Vanilla CSS3.
- Features custom CSS Design Tokens (`tokens.css`), responsive layouts (Flexbox & CSS Grid), accessible ARIA attributes, glassmorphism cards, and an interactive 0–9 virtual numpad.
- Zero client-side framework bloat (no React, Angular, or Vue), ensuring sub-second load times and minimal resource consumption.

#### 7. Global Competitive Leaderboards & Historical Player Profile
- **Top 3 Podiums**: Visual gold (🥇), silver (🥈), and bronze (🥉) winner pedestals.
- **Player Profile Analytics**: Dynamic computation of win ratios, accuracy percentages, best recorded streaks, and total score.
- **Visual Attempt Audit Trail**: Interactive timeline displaying past puzzle attempts with image thumbnails, player guess, response time, and points earned.

---

### Summary Checklist for Oral Presentation / Viva

| Question Topic | Key Talking Points | Primary Source Files |
|---|---|---|
| **Version Control** | Conventional Git commits, semantic evolution from v1.0 baseline to post-release XAMPP MySQL dual-driver, ANSI SQL normalization, UTC timezone fix, and Vercel serverless deployment. | `git log`, `scripts/setup-mysql.js`, `api/index.js`, `vercel.json` |
| **Event-Driven Architectures** | GUI button clicks, physical keyboard listeners (0-9, Enter), 180s countdown timer and timeout events, client Pub/Sub bus (`game:challenge-loaded`, `game:answer-result`), Node.js backend domain events (`challenge.started`, `answer.submitted`, `challenge.completed`, `score.updated`). | `public/js/game.js`, `public/js/event-bus.js`, `src/events/event-emitter.js`, `src/events/event-handlers.js` |
| **Interoperability** | Uses Dr. Marc Conrad's Banana API (`/uob/banana/api.php?out=json`), handles 301 redirects, 8s timeout via `AbortController`, schema contract validation, graceful offline fallback, REST over HTTP/1.1 & HTTPS, JSON interchange, and MySQL binary protocol. | `src/services/banana-api.service.js`, `public/js/api-client.js`, `src/config/database.js` |
| **Virtual Identity** | Relational user entities (`users`, `user_stats`), custom avatar colors, salted `bcryptjs` password hashing (10 rounds), `HttpOnly` + `SameSite=Lax` session cookies, session fixation defense, CSRF token verification, IP rate limiting, and anti-IDOR user validation. | `src/services/auth.service.js`, `src/app.js`, `src/middleware/csrf.middleware.js`, `src/middleware/rate-limit.middleware.js`, `src/services/game.service.js` |
| **Other Features** | Server-side solution secrecy (anti-cheat), dual-database abstraction (SQLite + XAMPP MySQL) with auto-failover, authoritative speed & streak scoring engine, offline resilience, and 24 passing automated tests. | `src/services/banana-api.service.js`, `src/config/database.js`, `tests/test-runner.js` |
