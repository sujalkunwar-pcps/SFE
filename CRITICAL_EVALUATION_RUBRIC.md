# 🎓 Banana Brain — First-Class Honours (70%+) Marking Criteria Guide
**Assessment:** Distributed Systems & Software Engineering (SFE) — University of Bedfordshire  
**Student:** Sujal Kunwar (`sujal.kunwar@patancollege.edu.np`)  
**Repository:** [github.com/sujalkunwar-pcps/SFE](https://github.com/sujalkunwar-pcps/SFE.git)  

---

## 🔍 Understanding the Difference: 2:1 (60-69%) vs 1st Class (70%+)

| Grade Band | What the Examiner Looks For |
|---|---|
| **60–69% (2:1)** | You explain **what** you did and **how** it works in your code. |
| **70%+ (1st Class)** | You critically justify **WHY** you chose this approach over **ALTERNATIVE approaches**, discussing trade-offs, security, maintainability, and scalability. |

Below is your complete evaluation sheet across all 4 criteria answering the exact 70%+ requirements.

---

## 1. Version Control & Code Organization (Target: 70%+ First Class)

### Rubric Requirement:
> *"You critically evaluate the structure of your code and its organization into components, considering alternative approaches. You also reflect on how version control strategies, like branching, tagging, and code reviews, enhance the quality, scalability, and maintainability of your application."*

### 1. Code Structure: Critical Evaluation & Alternative Approaches

#### Why we chose Layered Architecture (`Routes` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Repositories`):
- **High Cohesion & Single Responsibility**: Each layer has one job:
  - `Routes`: URL endpoint mapping.
  - `Controllers`: HTTP request/response parsing and input validation.
  - `Services`: Core business logic (Dr. Conrad's API calls, scoring algorithms, password hashing).
  - `Repositories`: Database SQL operations.
- **Maintainability**: If we change the database from SQLite to MySQL or MongoDB, we only modify the Repository layer without touching the Controller, Service, or Route code.
- **Testability**: Services can be tested in isolation using mock doubles without spinning up live HTTP servers or databases.

#### Alternative Approach Considered: Monolithic / All-in-One Controller
- **Why Rejected**: In a monolithic script (e.g. putting database queries, API calls, and HTML rendering inside a single `server.js`), any change to one feature risks breaking unrelated features. It creates "spaghetti code", makes unit testing impossible, and prevents multiple developers from collaborating on separate components.

---

### 2. Version Control Strategy: Critical Evaluation & Alternative Approaches

#### Why we used Feature Branching + Semantic Tagging:
- **Feature Branching**: We created 12 distinct feature branches (e.g., `feature/banana-api-adapter`, `feature/virtual-identity-auth`, `feature/game-loop-scoring`).
  - *Benefit*: Keeps work isolated until fully tested. The `main` branch remains stable, deployable, and bug-free at all times.
- **Semantic Release Tagging**: We stamped milestone release tags on the repository:
  - `v0.1.0-scaffold`: Initial project structure and dependencies.
  - `v0.5.0-alpha`: Core UI, Banana API adapter, and auth modules.
  - `v1.0.0-release`: Complete working game loop, event-driven architecture, and 24 tests.
  - `v1.1.0-complete`: MySQL XAMPP support, Vercel serverless deployment, and defense docs.
  - *Benefit*: Enables reproducible deployments and rollback capability to known stable snapshots.

#### Alternative Approach Considered: Trunk-Based Direct Commits to Main
- **Why Rejected**: Committing directly to `main` without branches or tags leads to merge collisions, broken builds, and makes rollbacks risky. It does not reflect professional industrial software engineering.

---

## 2. Event-Driven Architectures (Target: 70%+ First Class)

### Rubric Requirement:
> *"You justify the approach taken when implementing events and event handlers into your software."*  
> *(And: "confidently reflect upon how events are generated and what mechanisms are in place to handle them.")*

### 1. How Events are Generated & Handled
- **Client Presentation Tier**:
  - `click` events on numeric keypad buttons (`0-9`).
  - `keydown` events on physical keyboards (`0-9`, `Enter`, `Space`, `Escape`).
  - `setInterval` 1,000ms timer ticks down the 180s countdown clock.
  - `game:timeout` event fires when the timer reaches 0s, locking inputs and resetting streaks.
  - `ClientEventBus` (`public/js/event-bus.js`) decouples UI animations and audio from network requests.
- **Server Application Tier**:
  - Built with Node.js native `EventEmitter` (`src/events/event-emitter.js`).
  - Dispatches domain events: `challenge.started`, `answer.submitted`, `challenge.completed`, `score.updated`, and `user.registered`.

---

### 2. Critical Justification & Alternative Approaches

#### Why Event-Driven Architecture was chosen:
- **Asynchronous Decoupling**: When a player submits an answer, verifying correctness is time-sensitive (the user wants instant feedback). Domain events allow secondary tasks—such as logging audit attempts to `game_attempts`, recalculating global leaderboard positions, and recording player telemetry—to execute asynchronously without delaying the HTTP response.
- **Extensibility (Open/Closed Principle)**: New event handlers (e.g. sending an email notification, push notification, or anti-cheat anomaly alert) can be attached by registering a new `eventBus.on()` listener without modifying a single line of core game loop logic.

#### Alternative Approach Considered: Synchronous Procedural Calls
- **Why Rejected**: Calling `auditLogger()`, `updateLeaderboards()`, `sendAnalytics()` sequentially in the controller creates a tightly coupled dependency chain. If any secondary logging or leaderboard step fails or hangs, the entire user game request would crash or suffer latency.

#### Alternative Approach Considered: Heavy Distributed Message Brokers (RabbitMQ / Kafka / Redis)
- **Why In-Process `EventEmitter` was chosen**: For a single-node distributed web service adapter, in-memory `EventEmitter` provides zero-latency, in-process execution with zero external daemon configuration overhead. In future production scaling across multiple cluster nodes, the `eventBus` interface can be swapped for Redis Pub/Sub without altering the application services.

---

## 3. Interoperability (Target: 70%+ First Class)

### Rubric Requirement:
> *"You critically justify the approaches you have taken to include third-party software, such as a web service, into your application."*  
> *(And: "confidently reflect on how your code works together with other code written in a different architecture or running on a different system.")*

### 1. Interoperability Overview
- **Boundary 1 (Client $\leftrightarrow$ Server)**: Browser talks to Express backend via RESTful JSON over HTTP/1.1.
- **Boundary 2 (Server $\leftrightarrow$ Banana API)**: Backend calls Dr. Marc Conrad's external PHP microservice (`https://marcconrad.com/uob/banana/api.php?out=json`) over HTTPS over TLS.
- **Boundary 3 (Server $\leftrightarrow$ Database)**: Backend communicates with MariaDB/MySQL via TCP port 3306 using MySQL Binary Protocol (`mysql2`) and with SQLite.

---

### 2. Critical Justification & Alternative Approaches

#### Why Backend-as-a-Proxy (Adapter Pattern) was chosen:
We interoperate with Dr. Conrad's Banana API through a dedicated backend adapter (`src/services/banana-api.service.js`) rather than having the browser call it directly:
1. **Critical Security Invariant (Solution Withholding)**:
   - Dr. Conrad's API returns `{ question: "img_url", solution: 8 }` in a single JSON payload.
   - If the browser called it directly, the solution would be exposed in the Network tab, allowing users to cheat.
   - Our backend acts as an authoritative proxy: it strips `solution`, saves it in the database, and sends *only* `{ id, imageUrl, expiresAt }` to the browser.
2. **CORS (Cross-Origin Resource Sharing)**:
   - Modern browsers block cross-origin AJAX requests unless the external server sets explicit CORS headers. By proxying through our backend, we bypass CORS limitations seamlessly.
3. **Resilience & Fault Tolerance**:
   - The adapter handles HTTP 301 redirects, enforces an 8-second `AbortController` timeout, validates schema contracts, and engages fallback fixtures (`FALLBACK_PUZZLES`) during network partitions.

#### Alternative Approach Considered: Direct Browser Fetch (`fetch()` in `game.js`)
- **Why Rejected**: Completely compromises game security (exposes the answer in client memory), fails due to browser CORS policies, and leaves client devices vulnerable to network hangs when Dr. Conrad's university server is offline.

#### Alternative Protocols Considered:
- **REST / JSON (Chosen)**: Lightweight, stateless, human-readable, universal compatibility.
- **GraphQL**: Overkill for a fixed 2-field data contract (`question` and `solution`).
- **WebSockets**: Unnecessary connection overhead for simple request-response puzzle fetching (though viable for real-time multiplayer).
- **gRPC / Protocol Buffers**: Requires strict proto compilation and control over the remote server, which is not available for Dr. Conrad's existing PHP web service.

---

## 4. Virtual Identity & Security (Target: 70%+ First Class)

### Rubric Requirement:
> *"You critically discuss the authentication mechanisms that are used by your code to establish virtual identity and the role they play to make your application secure while also considering alternative approaches."*

### 1. Mechanisms Used in Banana Brain
1. **Relational Persona**: `users` and `user_stats` tables link player handles, avatar colors, scores, accuracy %, and attempt history.
2. **Password Cryptography**: Salted bcrypt hashing with 10 salt rounds (`bcryptjs`). Constant-time comparison (`bcrypt.compare()`).
3. **Stateful Session Cookies**: `express-session` with `banana_brain_sid`, `httpOnly: true`, `sameSite: 'lax'`, `secure: env.COOKIE_SECURE`, and session regeneration on login.
4. **Anti-IDOR Protection**: Line 76 of `src/services/game.service.js`: `if (challenge.user_id !== userId) throw 403 Forbidden`.
5. **Anti-CSRF & IP Rate Limiting**: Anti-CSRF token verification and sliding-window IP throttling (10 requests per 15 minutes).

---

### 2. Critical Justification & Alternative Approaches

#### Why Stateful Session Cookies (`HttpOnly`) vs Stateless JWT (JSON Web Tokens):
- **Chosen: Stateful Session Cookies (`HttpOnly`)**:
  - **XSS Immunity**: `HttpOnly: true` guarantees that client-side JavaScript (`document.cookie`) cannot read or export the session token. Even if an attacker executes an XSS injection, they cannot steal the session.
  - **Immediate Invalidation**: The server can revoke a session instantly on logout (`req.session.destroy()`).
- **Alternative Considered: JWT stored in `localStorage`**:
  - **Why Rejected**: `localStorage` is accessible to any JavaScript running on the page. If a third-party dependency is compromised, an attacker can steal the JWT. Furthermore, standard JWTs cannot be revoked before their expiration time without maintaining a centralized token blacklist (which defeats the stateless purpose of JWTs).

#### Why Salted Bcrypt vs Fast Hashing (MD5 / SHA-256):
- **Chosen: Bcrypt with 10 Salt Rounds**:
  - **Adaptive Work Factor**: Bcrypt is intentionally CPU-intensive ($2^{10} = 1,024$ iterations). Modern GPUs cannot brute-force bcrypt at scale.
  - **Salt Protection**: Unique 128-bit random salts ensure identical passwords produce completely different hash strings, neutralizing Rainbow Table attacks.
- **Alternative Considered: Plain SHA-256 or MD5**:
  - **Why Rejected**: SHA-256 and MD5 are designed for high-speed file checksums, not passwords. A modern GPU can compute billions of SHA-256 hashes per second, making dictionary attacks trivial.

---

## 🎯 Summary Checklist for First-Class Honors

| Rubric Area | What You Have in Code | What to Say in Viva / Presentation |
|---|---|---|
| **Version Control** | 13 commits, 12 feature branches, 4 semantic tags (`v0.1.0-scaffold` $\rightarrow$ `v1.1.0-complete`), Layered Architecture. | *"We chose a Layered Architecture over a monolith for maintainability and testability. We used Feature Branching and Semantic Tagging to ensure main is always stable and reproducible."* |
| **Event-Driven** | Client DOM events (click, keydown, setInterval), `ClientEventBus`, Node.js `EventEmitter` (`challenge.completed`, `score.updated`). | *"We chose event-driven design over synchronous calls so that secondary tasks like audit logging and leaderboard calculations run asynchronously without slowing down gameplay."* |
| **Interoperability** | Outbound HTTPS adapter to Dr. Conrad's Banana API, 301 redirect following, 8s timeout, fallback fixtures, MySQL on port 3306. | *"We used a backend proxy adapter instead of direct browser fetch to bypass CORS, protect server availability with 8s timeouts, and critically withhold the puzzle solution so players cannot cheat."* |
| **Virtual Identity** | Relational user profile, bcrypt 10 rounds, `express-session` with `HttpOnly` and `SameSite`, Anti-IDOR ownership checks. | *"We chose HttpOnly session cookies over JWT in localStorage because HttpOnly cookies cannot be stolen via JavaScript XSS, and we chose salted bcrypt over fast hashes to resist GPU brute-force attacks."* |
