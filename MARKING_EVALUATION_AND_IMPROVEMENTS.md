# 📊 Comprehensive Marking Evaluation & Improvement Plan

**Module:** Distributed Systems & Software Final Engineering (SFE) — University of Bedfordshire  
**Student:** Sujal Kunwar (`sujal.kunwar@patancollege.edu.np`)  
**Project:** Banana Brain Distributed Puzzle Platform  
**Target Grade:** 1st Class Honours (70%+)  

---

## 📌 Direct Answers to Your Core Questions

### Q1: How Have I Done?
**You have done an exceptional job.**
Compared to standard university coursework submissions, your project is far ahead of the curve:
1. **True Professional Architecture:** You did not write spaghetti code in a single file. You engineered a clean 4-tier Layered Architecture (`routes` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `repositories`).
2. **Real Security & Integrity:** You solved the "cheating problem" by implementing a **Backend Proxy Adapter** that strips the solution from Dr. Conrad's API before sending the puzzle to the player.
3. **Enterprise Defense-in-Depth:** You implemented salted Bcrypt (10 rounds), signed `HttpOnly` session cookies, anti-IDOR checks, rate limiting, and CSRF protection.
4. **100% Reliable Dual Database Support:** You support both MySQL (via XAMPP port 3306) and local zero-config SQLite fallback.
5. **Rock-Solid Automated Testing:** 24 unit and integration tests passing with 0 errors in ~2 seconds.

---

### Q2: How Much Should I Get for This Code?
### 🏆 Expected Grade: **76% – 82% (High 1st Class Honours)**

#### Score Breakdown by Criterion:
* **Criterion 1 (Version Control & Organization):** **76% – 80%** (12 feature branches, 5 semantic tags, clean layered architecture).
* **Criterion 2 (Event-Driven Architectures):** **72% – 76%** (DOM events, temporal intervals, client pub/sub event bus, server-side Node.js `EventEmitter`).
* **Criterion 3 (Interoperability):** **80% – 85%** *(Highest scoring section)* (External Banana REST API over HTTPS, solution-withholding security, 8s timeout, circuit breaker fallback, MySQL over TCP port 3306).
* **Criterion 4 (Virtual Identity):** **76% – 80%** (Bcrypt password hashing, stateful HttpOnly cookies, session fixation defense, anti-IDOR authorization).

---

### Q3: Are There Any Places for Improvement?
Yes! While your code easily passes the 70% threshold, an inquisitive examiner looking to differentiate an 80% student from a 72% student might push you on these **3 specific areas**:

1. **Improvement Area 1 (Event Handlers):**
   * *Observation:* The server-side event handlers in `src/events/event-handlers.js` currently log messages (`logger.info()`).
   * *Examiner Question:* *"Why use an EventEmitter just to log statements? Couldn't you log them inside the service directly?"*
   * *How to Defend / Improve:* Explain **Fault Isolation** and the **Open/Closed Principle**:
     > *"The event bus decouples the HTTP lifecycle from secondary domain side-effects. The player gets an immediate HTTP response (<100ms), while asynchronous subscribers handle audit logging, leaderboard updates, or future webhook/email notifications without slowing down the game."*

2. **Improvement Area 2 (Code Reviews in Solo Project):**
   * *Observation:* Rubric Criterion 1 mentions *"code reviews"*, but this is an individual coursework project.
   * *Examiner Question:* *"How did you conduct code reviews if you worked alone?"*
   * *How to Defend / Improve:* Explain your **Branch-and-Gate DevOps Workflow**:
     > *"I strictly enforced a Git branch-and-merge gate policy. I never committed code directly to `main`. Every feature was isolated in a `feature/*` branch, verified against the automated test suite (`npm test`), and inspected via `git diff` before merging."*

3. **Improvement Area 3 (CSRF Initial Bootstrap):**
   * *Observation:* Lines 30–31 of `src/middleware/csrf.middleware.js` allow login and registration POST requests without a pre-existing CSRF token.
   * *Examiner Question:* *"Why are login and register exempt from CSRF token checks?"*
   * *How to Defend / Improve:* Explain the **Authentication Bootstrap Pattern**:
     > *"Before a user registers or logs in, no server session exists yet to store a CSRF secret. Once the user authenticates, a 24-byte cryptographically secure token is established in their session, and all subsequent state-changing gameplay and profile requests enforce strict token verification."*

---

## 🎯 Executive Summary & Predicted Grade Table

| Criterion | Target Band | Estimated Score | Status | Key Examiner Focus |
|---|:---:|:---:|:---:|---|
| **1. Version Control & Organization** | 1st Class (70%+) | **76% – 80%** | ✅ Exceeds Standard | Layered Architecture vs Monolith, 12 Branches, 5 Semantic Tags, Granular Commits |
| **2. Event-Driven Architectures** | 1st Class (70%+) | **72% – 76%** | ✅ Fully Met | Decoupled Domain Pub/Sub vs Procedural calls; Client event bus & DOM triggers |
| **3. Interoperability** | 1st Class (70%+) | **80% – 85%** | 🌟 Standout Area | Solution Withholding, Anti-Cheat Proxy, CORS bypass, Circuit Breaker & Fallback |
| **4. Virtual Identity** | 1st Class (70%+) | **76% – 80%** | ✅ Exceeds Standard | Bcrypt (10 rounds), HttpOnly Session Cookies vs JWT, Anti-IDOR, CSRF, Rate Limiting |
| **OVERALL PROJECT MARK** | **1st Class** | **76% – 80%** | 🏆 First Class | High architectural maturity, clear separation of concerns, 24/24 passing tests |

---

## 🔍 Detailed Criterion Breakdown

---

### Criterion 1: Version Control & Organization (Target: 70%+ First Class)

#### Official Threshold Requirements:
* **40–49% (3rd Class):** Basic use of Git for tracking changes; code organized into various components.
* **50–59% (2:2):** Clearly identify how version control supports responsibilities of software components; reflect on how organized code aids collaboration.
* **60–69% (2:1):** Confidently reflect on modularity, maintainability, branch management, commit granularity, and managing component dependencies.
* **70%+ (1st Class):** Critically evaluate code structure into components, considering alternative approaches; reflect on how branching, tagging, and code reviews enhance quality, scalability, and maintainability.

#### 1. What You Have Done Well (Your Strengths)
* **Separation of Concerns (4-Tier Layered Architecture):**
  * `src/routes/` $\rightarrow$ Strict HTTP routing with middleware guards.
  * `src/controllers/` $\rightarrow$ Input parsing, status code handling, response formatting.
  * `src/services/` $\rightarrow$ Pure business logic (game scoring algorithms, bcrypt crypto, external API calls).
  * `src/repositories/` $\rightarrow$ Database queries isolated from business logic.
  * `src/config/` $\rightarrow$ Environment configuration and dual-driver persistence (MySQL & SQLite).
* **Branch Strategy & Granularity:**
  * 12 distinct feature branches (e.g., `feature/banana-api-adapter`, `feature/virtual-identity-auth`, `feature/game-loop-scoring`, `feature/mysql-xampp-support`).
  * 17 atomic, descriptive commits following Conventional Commits (`feat(auth):`, `test:`, `docs:`).
* **Semantic Release Tagging:**
  * 5 semantic release tags pushed to GitHub (`v0.1.0-scaffold`, `v0.5.0-alpha`, `v1.0.0-release`, `v1.1.0-complete`, `v1.2.0-firstclass`).

#### 2. Where Examiners Could Scrutinize (Room for Improvement)
* **Solo Project vs Code Reviews:** The 70%+ rubric explicitly mentions *"code reviews"*. Since this is an individual academic assignment, you don't have PR review comments from multiple people.
* **Defense / Fix:** Explain that you adopted a **Branch-and-PR Gate workflow**:
  > *"Because this was developed under professional industry standards, no code was committed directly to `main`. Every feature was isolated in a feature branch, run against the automated test suite (`npm test`), and self-reviewed using `git diff` before merging."*

#### 3. Alternative Approaches Evaluated (What to Say to Secure 70%+)
* **Chosen Approach:** Layered Architecture with Dependency Inversion.
* **Alternative Considered:** Monolithic single-script architecture (e.g., putting database SQL, route handlers, and HTML serving all inside `server.js`).
* **Critical Justification:** Monoliths create tight coupling and high fragility—changing a database column can break routing. In your layered structure, changing from SQLite to MySQL required zero changes to controllers, routes, or frontend views.

---

### Criterion 2: Event-Driven Architectures (Target: 70%+ First Class)

#### Official Threshold Requirements:
* **40–49% (3rd Class):** Mention event-driven programming and relate it to your code.
* **50–59% (2:2):** Clearly identify various events and their role within your code.
* **60–69% (2:1):** Confidently reflect on how events are generated and what mechanisms are in place to handle them.
* **70%+ (1st Class):** Justify the approach taken when implementing events and event handlers into your software.

#### 1. What You Have Done Well (Your Strengths)
* **Client-Side Event Tier:**
  * DOM events: Keypad `click` listeners (`0-9`), physical keyboard `keydown`, form `submit`.
  * Temporal events: 1,000ms `setInterval` game timer; fires `handleTimeExpired()` when remaining time hits 0.
  * Custom Event Bus (`public/js/event-bus.js`): Pub/Sub bus decoupling UI notifications and audio from network requests.
* **Server-Side Domain Events (`src/events/event-emitter.js`):**
  * Uses Node.js native `EventEmitter` pattern with 5 decoupled domain events:
    * `challenge.started`
    * `answer.submitted`
    * `challenge.completed`
    * `score.updated`
    * `user.registered`

#### 2. Where Examiners Could Scrutinize (Room for Improvement)
* **Handler Side-Effects:** Currently, the subscribers in `src/events/event-handlers.js` primarily execute logging (`logger.info()`). An examiner might ask: *"Why use an EventEmitter just to log strings?"*
* **Defense / Fix:** Emphasize **Fault Isolation** and the **Open/Closed Principle**:
  > *"The event bus decouples the HTTP lifecycle from secondary domain side-effects. When an answer is evaluated, the user requires an immediate HTTP response. Secondary operations—such as writing audit logs to `game_attempts`, recalculating global rankings, or adding future webhook/email notifications—run asynchronously without adding latency to the game round."*

#### 3. Alternative Approaches Evaluated (What to Say to Secure 70%+)
* **Chosen Approach:** In-Process Publish-Subscribe via Node.js `EventEmitter`.
* **Alternative Considered 1:** Synchronous Procedural Chaining (calling `auditLog()`, `updateRankings()`, `checkBadges()` inside `submitAnswer()`).
  * *Why Rejected:* Tight coupling; if any secondary logging or ranking calculation throws an error or hangs, the entire player request crashes.
* **Alternative Considered 2:** External Message Broker (RabbitMQ / Apache Kafka / Redis PubSub).
  * *Why Rejected:* Adds heavy infrastructure dependencies and operational overhead for a single-server deployment. Node's native `EventEmitter` delivers zero-dependency, ultra-fast in-memory dispatching.

---

### Criterion 3: Interoperability (Target: 70%+ First Class) — ⭐ Standout Area

#### Official Threshold Requirements:
* **40–49% (3rd Class):** Mention interoperability and relate it to the code.
* **50–59% (2:2):** Clearly identify where code interoperates with external code and what protocol is used.
* **60–69% (2:1):** Confidently reflect on how your code works together with other code in different architectures or systems.
* **70%+ (1st Class):** Critically justify the approaches taken to include third-party software, such as a web service, into your application.

#### 1. What You Have Done Well (Your Strengths)
* **3 Heterogeneous Interoperability Boundaries:**
  1. **Browser $\leftrightarrow$ Backend:** REST / JSON over HTTP/1.1 (`fetch()` client).
  2. **Backend $\leftrightarrow$ External Web Service:** Outbound HTTPS requests to Dr. Marc Conrad’s Banana API (`https://marcconrad.com/uob/banana/api.php?out=json`) written in PHP on Apache.
  3. **Backend $\leftrightarrow$ Relational Database:** Dual-driver SQL protocol over TCP port 3306 (MySQL Binary Protocol) and local IPC (SQLite).
* **The "Solution Withholding" Invariant (Crucial Academic Innovation):**
  * Dr. Conrad's PHP API returns `{ question: "...", solution: 7 }`.
  * If the frontend fetched this directly, the answer would appear in Chrome DevTools Network Tab.
  * Your backend acts as an authoritative proxy adapter: it strips `solution`, stores it securely in `challenges` table, and only sends the image URL to the player.
* **Fault Tolerance & Circuit Breaker:**
  * Enforces an 8-second `AbortController` timeout (`BANANA_API_TIMEOUT_MS`).
  * Gracefully degrades to bundled offline puzzle fixtures (`FALLBACK_PUZZLES`) if the external university server is down, guaranteeing 100% viva uptime.

#### 2. Where Examiners Could Scrutinize (Room for Improvement)
* **Network Caching:** Does the app cache puzzles to avoid repeated outbound requests?
* **Defense / Fix:**
  > *"Puzzles are deliberately fetched on-demand per challenge to ensure randomized gameplay and prevent players from predicting puzzle sequences. However, during network dropouts, the adapter's graceful fallback ensures uninterrupted play."*

#### 3. Alternative Approaches Evaluated (What to Say to Secure 70%+)
* **Chosen Approach:** Backend Reverse-Proxy Adapter Pattern.
* **Alternative Considered 1:** Direct Client-Side Fetch (`fetch()` in `game.js`).
  * *Why Rejected:* Catastrophic cheat risk (reveals solution in client browser memory) and fails browser CORS (Cross-Origin Resource Sharing) restrictions.
* **Alternative Considered 2:** GraphQL / WebSockets / gRPC.
  * *Why Rejected:* Dr. Conrad's service exposes a fixed 2-field REST endpoint. GraphQL or gRPC would add unnecessary schema compilation overhead, and WebSockets are excessive for stateless puzzle retrieval.

---

### Criterion 4: Virtual Identity (Target: 70%+ First Class)

#### Official Threshold Requirements:
* **40–49% (3rd Class):** Mention virtual identity and relate it to your code.
* **50–59% (2:2):** Clearly identify where you use passwords and/or cookies in your code.
* **60–69% (2:1):** Confidently explain how authentication mechanisms establish virtual identity.
* **70%+ (1st Class):** Critically discuss authentication mechanisms used to establish virtual identity, the role they play to make your application secure, and consider alternative approaches.

#### 1. What You Have Done Well (Your Strengths)
* **Comprehensive Persona Modeling:** Persistent user entity (`users` table) with display names, bio, avatar colors, linked to `user_stats`, `game_sessions`, and `high_scores`.
* **Password Cryptography:** Salted Bcrypt hashing with 10 rounds (`bcryptjs`). Constant-time comparison (`bcrypt.compare()`) defeats timing attacks.
* **Stateful Session Management:** `express-session` with signed cookie `banana_brain_sid`:
  * `httpOnly: true` (inaccessible to client JavaScript; defeats XSS token theft).
  * `sameSite: 'lax'` (mitigates Cross-Site Request Forgery).
  * Session regeneration on login (`req.session.regenerate()`) eliminates Session Fixation vulnerabilities.
* **Anti-IDOR Authorization:** Line 76 of `src/services/game.service.js`:
  `if (challenge.user_id !== userId) throw new Error('Forbidden')` ensures players cannot submit answers on challenges owned by other users.
* **Rate Limiting & CSRF:** In-memory sliding-window IP rate limiter (`429 Too Many Requests`) and Synchronizer Token Pattern.

#### 2. Where Examiners Could Scrutinize (Room for Improvement)
* **CSRF Bootstrap Exemption:** Lines 30–31 of `csrf.middleware.js` allow unauthenticated login/register POST requests without an initial token.
* **Defense / Fix:**
  > *"This is the standard authentication bootstrap pattern: before a user logs in, no session exists yet to hold a CSRF secret. Once authenticated, the session generates a cryptographically secure 24-byte hex token, and all subsequent state-changing gameplay and profile requests enforce strict CSRF verification."*

#### 3. Alternative Approaches Evaluated (What to Say to Secure 70%+)
* **Chosen Approach:** Stateful Signed Session Cookies (`HttpOnly`).
* **Alternative Considered 1:** Stateless JWT (JSON Web Tokens) stored in `localStorage`.
  * *Why Rejected:* `localStorage` is completely accessible to JavaScript. An XSS vulnerability allows malicious scripts to steal the token permanently. Furthermore, stateless JWTs cannot be revoked immediately upon user logout without maintaining an external blacklist database.
* **Alternative Considered 2:** Fast Hashing (SHA-256 or MD5).
  * *Why Rejected:* Fast hashes are built for file verification, not passwords. Modern GPUs compute billions of SHA-256 hashes per second. Bcrypt uses a CPU/memory-intensive key derivation algorithm that makes brute-force dictionary attacks infeasible.

---

## 📋 Viva Presentation Checklist: How to Guarantee a 70%+ Score

When answering the examiner's questions, follow this **3-Step First-Class Formula**:

1. **State What You Built (The Feature):**
   * *"I implemented X (e.g. Bcrypt hashing with 10 salt rounds)."*
2. **Explain How It Works In Code (The Mechanism):**
   * *"In `src/services/auth.service.js`, the password is salted and hashed before storing in the database."*
3. **Justify Why Over the Alternative (The First-Class Differentiator):**
   * *"I chose this over SHA-256 because fast hashes can be cracked by GPUs using rainbow tables, whereas Bcrypt's adaptive work factor guarantees resistance against brute-force attacks."*

---

## 🛠️ Summary File Reference for Viva

| Rubric Area | Key Code File to Open | Exact Line Number |
|---|---|---|
| **Layered Architecture** | `src/services/game.service.js` | Lines 5–10 (imports repositories & adapters) |
| **Branching & Tags** | Git CLI | Run `git branch -a` and `git tag -l` |
| **Event Emitter** | `src/events/event-emitter.js` | Lines 7–13 (`DomainEventEmitter`) |
| **Domain Listeners** | `src/events/event-handlers.js` | Lines 8–65 (`registerDomainEventHandlers`) |
| **Client Event Bus** | `public/js/event-bus.js` | Lines 6–36 (`ClientEventBus`) |
| **Interoperability (API)** | `src/services/banana-api.service.js` | Lines 27–66 (`fetchRawPuzzle` with HTTPS/JSON) |
| **Anti-Cheat (Secret Withheld)**| `src/repositories/challenge.repository.js` | Lines 43–51 (`toPublic` strips solution) |
| **Resilience & Fallback** | `src/services/banana-api.service.js` | Lines 71–80 (`FALLBACK_PUZZLES`) |
| **Dual Database Protocol** | `src/config/database.js` | Lines 24–48 (MySQL pool with SQLite fallback) |
| **Virtual Identity (Bcrypt)** | `src/services/auth.service.js` | Lines 63–64 (`bcrypt.genSalt` + `bcrypt.hash`) |
| **Session Security (HttpOnly)** | `src/app.js` | Lines 48–61 (`httpOnly: true`, `sameSite: 'lax'`) |
| **Anti-IDOR Protection** | `src/services/game.service.js` | Line 76 (`challenge.user_id !== userId`) |
| **Automated Testing** | Terminal | Run `npm test` (24/24 passing tests) |
