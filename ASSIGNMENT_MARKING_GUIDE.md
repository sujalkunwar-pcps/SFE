# Assignment Marking Guide — Banana Brain

**Student:** Sujal Kunwar  
**Module:** Distributed Systems & Software Engineering (SFE)  
**Repository:** [github.com/sujalkunwar-pcps/SFE](https://github.com/sujalkunwar-pcps/SFE)

---

## How the Marking Works

There are **4 criteria**. Each criterion is graded on a scale:

| Grade Band | What It Means |
|---|---|
| **40–49% (3rd)** | You mention the concept and relate it to your code |
| **50–59% (2:2)** | You clearly identify where and how the concept appears in your code |
| **60–69% (2:1)** | You confidently reflect on how it works, explaining the mechanisms |
| **70%+ (1st)** | You critically justify **why** you chose this approach and discuss **alternative approaches** you considered |

> The jump from 2:1 to 1st is about saying **"I chose X instead of Y because..."**

---

## Criterion 1: Version Control & Code Organization

### What the rubric wants at 70%+
> *"You critically evaluate the structure of your code and its organization into components, considering alternative approaches. You also reflect on how version control strategies, like branching, tagging, and code reviews, enhance the quality, scalability, and maintainability of your application."*

### What you have in your code

**Code Organization — Layered Architecture:**

Your `src/` folder is split into 5 clear layers, each with one job:

| Layer | Folder | What it does | Example file |
|---|---|---|---|
| **Routes** | `src/routes/` | Maps URLs to controllers | `auth.routes.js`, `game.routes.js` |
| **Controllers** | `src/controllers/` | Reads the HTTP request, calls the service, sends the response | `auth.controller.js`, `game.controller.js` |
| **Services** | `src/services/` | Business logic (scoring, hashing passwords, calling the Banana API) | `game.service.js`, `auth.service.js` |
| **Repositories** | `src/repositories/` | Database queries only | `user.repository.js`, `challenge.repository.js` |
| **Config/Middleware** | `src/config/`, `src/middleware/` | Settings, auth guard, CSRF, rate limiting | `database.js`, `auth.middleware.js` |

The frontend (`public/`) is also organized: `css/` has 5 files (tokens, base, components, layout, pages) and `js/` has 7 modules (api-client, auth, event-bus, game, leaderboard, profile, ui).

**Version Control — Branches and Tags:**

| Feature | What you did |
|---|---|
| **Feature branches** | 12 branches (e.g. `feature/banana-api-adapter`, `feature/virtual-identity-auth`, `feature/event-driven-architecture`) |
| **Atomic commits** | 14+ commits with descriptive messages like `feat(auth): add virtual identity authentication, bcrypt hashing, and session management` |
| **Semantic tags** | 5 release tags: `v0.1.0-scaffold`, `v0.5.0-alpha`, `v1.0.0-release`, `v1.1.0-complete`, `v1.2.0-firstclass` |
| **Main always stable** | Features developed on branches, merged into `main` only when complete |

### What to say to hit 70%+ (the "why" and alternatives)

> **Code structure:** "I chose a Layered Architecture where Routes, Controllers, Services, and Repositories are separated. The alternative was a monolithic approach — putting everything in one `server.js` file. I rejected that because if I need to change the database from SQLite to MySQL, I only change the Repository layer. The Controller and Service code stays the same. It also lets me write unit tests for the scoring logic without needing a real database or HTTP server."

> **Version control:** "I used feature branching so that `main` is always stable and deployable. The alternative — committing directly to `main` — means any half-finished work could break the app. I also added semantic tags like `v1.0.0-release` so I can roll back to a known working version at any time. In a team, this would let developers work on separate branches without stepping on each other's code."

### ✅ Are you lacking anything? **No.** You have layered separation, 12 branches, 5 tags, and atomic commits. All 70%+ boxes are ticked.

---

## Criterion 2: Event-Driven Architecture

### What the rubric wants at 70%+
> *"You justify the approach taken when implementing events and event handlers into your software."*

### What you have in your code

**Client-side events (browser):**

| Event type | Where in code | What triggers it |
|---|---|---|
| `click` on numpad buttons (0–9) | `public/js/game.js` line 59–67 | Player taps a number |
| `keydown` for keyboard (0–9, Enter, Space) | `public/js/game.js` line 70–92 | Player presses a key |
| `submit` on login/register forms | `public/js/auth.js` line 15, 46 | Player clicks "Log In" or "Create Account" |
| `setInterval` timer (1000ms ticks) | `public/js/game.js` line 163 | Countdown timer ticks every second |
| Timer hits zero → `handleTimeExpired()` | `public/js/game.js` line 167–170 | 180 seconds run out |
| `DOMContentLoaded` | `public/js/game.js` line 255 | Page finishes loading |

**Client-side Pub/Sub event bus** (`public/js/event-bus.js`):
- Custom `ClientEventBus` class with `on()`, `off()`, `emit()` methods
- Events: `auth:state-changed`, `game:challenge-loaded`, `game:answer-submitted`, `game:answer-result`, `game:score-updated`, `ui:toast`
- This decouples the UI from the network — the game engine emits events, and separate UI handlers listen and update the display

**Server-side events (Node.js backend):**

| Domain event | Emitted in | What triggers it |
|---|---|---|
| `user.registered` | `src/services/auth.service.js` line 77 | A new player registers |
| `challenge.started` | `src/services/game.service.js` line 38 | A new puzzle is requested |
| `answer.submitted` | `src/services/game.service.js` line 170 | Player submits an answer |
| `challenge.completed` | `src/services/game.service.js` line 177 | Challenge is finished and scored |
| `score.updated` | `src/services/game.service.js` line 185 | Player's total score changes |

These are handled by subscribers in `src/events/event-handlers.js` that do logging and audit recording. The emitter is built on Node.js native `EventEmitter` in `src/events/event-emitter.js`.

### What to say to hit 70%+ (the "why" and alternatives)

> **Why event-driven:** "When a player submits an answer, they need instant feedback. But I also need to log the attempt, recalculate leaderboard rankings, and update streak records. If I did all that sequentially in the controller, the player would wait for every step to finish. Instead, I emit domain events like `answer.submitted` and `score.updated`. Separate handlers pick those up and process them without blocking the response."

> **Alternative considered — synchronous calls:** "I could have called `logAttempt()`, then `updateLeaderboard()`, then `checkAchievements()` one after another inside `submitAnswer()`. But if any of those steps fails or is slow, it blocks everything. Event-driven means those secondary tasks are independent."

> **Alternative considered — external message queues (RabbitMQ/Kafka):** "For a single-server application, in-process `EventEmitter` is the right choice. It has zero latency and no external infrastructure. If I needed to scale across multiple servers, I could swap the `eventBus` for Redis Pub/Sub without changing any of the services that emit or listen."

### ✅ Are you lacking anything? **No.** You have client DOM events, a custom client-side event bus, server-side `EventEmitter` with 5 domain events and 6 handlers. All 70%+ boxes are ticked.

---

## Criterion 3: Interoperability

### What the rubric wants at 70%+
> *"You critically justify the approaches you have taken to include third-party software, such as a web service, into your application."*

### What you have in your code

**Three interoperability boundaries:**

| Boundary | Protocol | Files involved |
|---|---|---|
| **Browser ↔ Your Server** | REST/JSON over HTTP | `public/js/api-client.js` → Express routes in `src/routes/` |
| **Your Server ↔ Banana API** | HTTPS/JSON (Dr. Conrad's PHP service at `marcconrad.com`) | `src/services/banana-api.service.js` |
| **Your Server ↔ Database** | MySQL Binary Protocol (port 3306) or SQLite (file) | `src/config/database.js` |

**How the Banana API adapter works** (`src/services/banana-api.service.js`):
1. Sends `GET https://marcconrad.com/uob/banana/api.php?out=json`
2. Follows HTTP 301/302 redirects automatically (`redirect: 'follow'`)
3. Enforces an 8-second timeout using `AbortController` (line 31–32)
4. Validates the response schema: checks `question` is a valid URL and `solution` is 0–9 (line 89–103)
5. If the API is down or unreachable, falls back to built-in sample puzzles (line 71–78) — **graceful degradation**
6. The backend strips the `solution` before sending data to the browser. The browser only gets `{ id, imageUrl, expiresAt }` — never the answer (see `challengeRepository.toPublic()` line 43–51)

**Dual database driver** (`src/config/database.js`):
- Tries MySQL first (XAMPP on port 3306)
- If MySQL connection fails, automatically falls back to SQLite
- Both use the same `query()`, `get()`, `run()` interface — the rest of the application doesn't know which database is running

### What to say to hit 70%+ (the "why" and alternatives)

> **Why a backend proxy adapter instead of calling the API from the browser:**
> 1. **Game security:** Dr. Conrad's API returns `{ question: "image_url", solution: 8 }` in one response. If the browser called it directly, players could see the answer in Chrome DevTools Network tab. My backend strips the solution and only sends the image URL. The answer stays on the server.
> 2. **CORS:** Browsers block cross-origin requests unless the external server sets CORS headers. Dr. Conrad's server doesn't. By proxying through my backend, there's no CORS issue.
> 3. **Reliability:** I added an 8-second timeout so if the university server is slow, the app doesn't hang. If it's completely down, fallback puzzles kick in automatically.

> **Alternative protocol — GraphQL:** "The Banana API returns a fixed 2-field response. GraphQL is designed for flexible queries on complex data. It would be overkill here."

> **Alternative protocol — WebSockets:** "WebSockets keep a persistent connection open. For simple request-response puzzle fetching, that's unnecessary overhead. WebSockets would make sense if I added real-time multiplayer."

### ✅ Are you lacking anything? **No.** You interoperate with an external PHP web service over HTTPS, use REST/JSON between client and server, and support two database protocols. All 70%+ boxes are ticked.

---

## Criterion 4: Virtual Identity

### What the rubric wants at 70%+
> *"You critically discuss the authentication mechanisms that are used by your code to establish virtual identity and the role they play to make your application secure while also considering alternative approaches."*

### What you have in your code

| Mechanism | Where in code | What it does |
|---|---|---|
| **User registration** | `src/services/auth.service.js` line 17–83 | Creates a new identity with username, email, hashed password, display name, avatar |
| **Bcrypt password hashing** | `src/services/auth.service.js` line 63–64 | 10 salt rounds. Passwords are never stored in plain text |
| **Login with credential verification** | `src/services/auth.service.js` line 89–124 | Uses `bcrypt.compare()` for constant-time comparison |
| **Session cookies** | `src/app.js` line 48–61 | `express-session` with cookie name `banana_brain_sid`, `httpOnly: true`, `sameSite: 'lax'`, 24-hour expiry |
| **Session regeneration** | `src/controllers/auth.controller.js` line 13, 36 | New session ID generated on login/register to prevent session fixation attacks |
| **Logout / session destruction** | `src/controllers/auth.controller.js` line 54–63 | `req.session.destroy()` + `clearCookie()` |
| **Auth guard middleware** | `src/middleware/auth.middleware.js` | Blocks unauthenticated requests to protected routes (game, profile, leaderboard) |
| **Anti-IDOR check** | `src/services/game.service.js` line 76 | `if (challenge.user_id !== userId) throw 403` — prevents player A from answering player B's challenge |
| **CSRF protection** | `src/middleware/csrf.middleware.js` | Synchronizer Token Pattern with `crypto.randomBytes(24)` |
| **Rate limiting** | `src/middleware/rate-limit.middleware.js` | Sliding window IP throttling, returns 429 with `Retry-After` header |
| **Relational identity** | `src/database/schema.sql` | `users` table linked to `user_stats`, `game_sessions`, `challenges`, `game_attempts` via foreign keys |
| **Security headers** | `src/app.js` line 35–41 | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy` |

### What to say to hit 70%+ (the "why" and alternatives)

> **Why HttpOnly session cookies instead of JWT in localStorage:**
> - `httpOnly: true` means JavaScript cannot access the session cookie. Even if an attacker injects malicious JavaScript (XSS), they cannot steal the session token.
> - JWT stored in `localStorage` is readable by any JavaScript on the page. If a third-party library is compromised, the token is exposed.
> - Stateful sessions can be revoked instantly on logout with `req.session.destroy()`. Standard JWTs stay valid until they expire — you'd need a server-side blacklist, which defeats the purpose of being stateless.

> **Why bcrypt instead of MD5 or SHA-256:**
> - MD5 and SHA-256 are fast hashing algorithms designed for file checksums. A modern GPU can compute billions of SHA-256 hashes per second, making brute-force attacks trivial.
> - Bcrypt is intentionally slow (10 salt rounds = 1,024 iterations). It also generates a unique random salt per password, so even if two users have the same password, the hashes are different. This prevents rainbow table attacks.

> **Why session regeneration on login:**
> - Without regeneration, an attacker could fix a session ID before the user logs in (session fixation). After login, the attacker would share the same session. `req.session.regenerate()` creates a fresh session ID on every privilege change.

### ✅ Are you lacking anything? **No.** You have bcrypt hashing, HttpOnly cookies, session regeneration, CSRF tokens, rate limiting, anti-IDOR, and security headers. All 70%+ boxes are ticked.

---

## Overall Verdict

| Criterion | What you have | Grade target | Lacking? |
|---|---|---|:---:|
| **1. Version Control** | 12 branches, 5 tags, 14+ commits, layered architecture | 70%+ | ❌ No |
| **2. Event-Driven** | DOM events, client event bus, server EventEmitter with 5 domain events | 70%+ | ❌ No |
| **3. Interoperability** | Banana API adapter over HTTPS, REST/JSON client-server, dual MySQL/SQLite | 70%+ | ❌ No |
| **4. Virtual Identity** | Bcrypt, HttpOnly cookies, CSRF, rate limiting, anti-IDOR, session regeneration | 70%+ | ❌ No |

**You are not lacking anything.** Your code and repository cover every requirement for the 1st Class Honours (70%+) threshold across all 4 criteria.

The key thing to remember: when your teacher asks *how* something works, also say **why you chose it and what the alternative was**. That's what separates 2:1 from 1st Class.

---

## Quick Reference — Files to Show Your Teacher

| When they ask about... | Open this file | Point to this line |
|---|---|---|
| Layered architecture | `src/services/game.service.js` | The imports at the top — service calls repository, not database directly |
| Event emitter | `src/events/event-emitter.js` | Line 7–13, the `DomainEventEmitter` class |
| Event handlers | `src/events/event-handlers.js` | Line 10–63, all 6 `eventBus.on()` subscribers |
| Client events | `public/js/game.js` | Line 48–92, `bindEvents()` method with click and keydown listeners |
| Client event bus | `public/js/event-bus.js` | Line 6–36, the `ClientEventBus` class |
| Banana API call | `src/services/banana-api.service.js` | Line 27–82, `fetchRawPuzzle()` with timeout and fallback |
| Solution withheld | `src/repositories/challenge.repository.js` | Line 43–51, `toPublic()` strips the solution |
| Password hashing | `src/services/auth.service.js` | Line 63–64, `bcrypt.genSalt(10)` + `bcrypt.hash()` |
| Session cookie setup | `src/app.js` | Line 48–61, `httpOnly: true`, `sameSite: 'lax'` |
| Anti-IDOR check | `src/services/game.service.js` | Line 76, `if (challenge.user_id !== userId)` |
| CSRF protection | `src/middleware/csrf.middleware.js` | Line 8–43 |
| Rate limiting | `src/middleware/rate-limit.middleware.js` | Line 6–60 |
| Session regeneration | `src/controllers/auth.controller.js` | Line 13 and 36, `req.session.regenerate()` |
| Database schema | `src/database/schema.sql` | 5 tables with foreign keys and indexes |
| Git branches | Run `git branch -a` in terminal | 12 feature branches |
| Git tags | Run `git tag -l` in terminal | 5 semantic release tags |
| Tests passing | Run `npm test` in terminal | 24 tests, 0 failures |
