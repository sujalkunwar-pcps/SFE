# Banana Brain — Teacher Demonstration & Assessment Defense Guide
**Module / Coursework:** Distributed Systems & Software Engineering (SFE) — University of Bedfordshire  
**Project:** Banana Brain — Distributed Mathematical Reasoning Challenge Platform  
**Target:** First-Class Honours (70%+)  
**Student:** Sujal Kunwar (`sujal.kunwar@patancollege.edu.np`)  
**Repository:** [github.com/sujalkunwar-pcps/SFE](https://github.com/sujalkunwar-pcps/SFE.git)  

---

## 📋 Table of Contents
1. [Core Concepts Explained in this Codebase](#1-core-concepts-explained-in-this-codebase)
   - [A. Interoperability](#a-interoperability)
   - [B. Event-Driven Architecture](#b-event-driven-architecture)
   - [C. Virtual Identity](#c-virtual-identity)
2. [Step-by-Step: How to Show Your Teacher (Live Demo Script)](#2-step-by-step-how-to-show-your-teacher-live-demo-script)
   - [Pre-Demo Setup (Do this before calling your teacher)](#pre-demo-setup)
   - [Demo Step 1: Virtual Identity Demonstration](#demo-step-1-virtual-identity-demonstration)
   - [Demo Step 2: Interoperability & Banana API Demonstration](#demo-step-2-interoperability--banana-api-demonstration)
   - [Demo Step 3: Event-Driven Architecture Demonstration](#demo-step-3-event-driven-architecture-demonstration)
   - [Demo Step 4: Automated Testing & Verification](#demo-step-4-automated-testing--verification)
3. [Teacher Q&A Cheat Sheet (Instant Answers)](#3-teacher-qa-cheat-sheet-instant-answers)

---

## 1. Core Concepts Explained in this Codebase

### A. Interoperability

#### 1. What it means:
Interoperability is the ability of two or more disparate software systems, running on different technologies, architectures, or environments, to exchange information accurately and execute coordinated business logic without human intervention.

#### 2. Where it is implemented in Banana Brain:
Banana Brain demonstrates interoperability across **three distinct system boundaries**:

```
┌─────────────────────────┐                                 ┌─────────────────────────┐
│     Client Browser      │ <==== [ Boundary 1 ] =========> │    Node.js Express 5    │
│ (Vanilla JS / HTML / CSS│      JSON over HTTP/1.1         │       Backend API       │
└─────────────────────────┘       + Session Cookies         └────────────┬────────────┘
                                                                         │
                         ┌───────────────────────────────────────────────┴───────────────────────────────┐
                         │                                                                               │
                         ▼ [ Boundary 2 ]                                                                ▼ [ Boundary 3 ]
             ┌───────────────────────┐                                                       ┌───────────────────────┐
             │   Dr. Marc Conrad's   │                                                       │     MariaDB / MySQL   │
             │   Banana API Server   │                                                       │   (XAMPP Daemon 3306) │
             │  (marcconrad.com)     │                                                       │   or SQLite Engine    │
             └───────────────────────┘                                                       └───────────────────────┘
```

- **Boundary 1: Client Browser $\leftrightarrow$ Express Backend API**
  - **Protocol**: HTTP/1.1 and HTTPS.
  - **Data Format**: Standardized UTF-8 JSON (`Content-Type: application/json`).
  - **Code File**: [`public/js/api-client.js`](file:///c:/Users/sujal/Desktop/SFE/public/js/api-client.js) communicates with Express routes (`src/routes/*`). It handles semantic status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`, `410 Gone`).

- **Boundary 2: Backend $\leftrightarrow$ Dr. Marc Conrad's Official Banana API**
  - **Endpoint**: `https://marcconrad.com/uob/banana/api.php?out=json`
  - **Protocol**: HTTPS over TLS 1.2/1.3.
  - **Code File**: [`src/services/banana-api.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/banana-api.service.js)
  - **Engineering Mechanisms**:
    1. **HTTP 301/302 Redirect Following**: The unencrypted endpoint `http://marcconrad.com/...` issues a `301 Moved Permanently`. Our outbound fetch client specifies `redirect: 'follow'` to smoothly resolve redirects without error.
    2. **8-Second Timeout Protection**: Uses `AbortController` (`new AbortController()`) with `signal: controller.signal` to abort outbound calls that exceed 8,000ms, protecting server worker threads from hanging during university network latency.
    3. **Contract Schema Validation**: `validateApiResponse(data)` inspects the external payload, ensuring `question` is a valid HTTP URL string and `solution` is an integer $0 \le x \le 9$.
    4. **Offline Resilience & Fallback Fixtures**: If Dr. Conrad's server is down, `BananaApiService` gracefully falls back to internal fixtures (`FALLBACK_PUZZLES`) so gameplay never crashes.
    5. **Critical Security Invariant (Server-Side Secret Stripping)**: While Dr. Conrad's API returns `{ question, solution }` together, our backend strips `solution`, stores it in the database under an unguessable UUID, and returns **only** `{ id, imageUrl, expiresAt }` to the client.

- **Boundary 3: Backend $\leftrightarrow$ Relational Database Storage**
  - **Protocol**: MySQL Binary Network Protocol (TCP Socket over port 3306) via `mysql2/promise` alongside embedded SQLite via native `node:sqlite`.
  - **Code File**: [`src/config/database.js`](file:///c:/Users/sujal/Desktop/SFE/src/config/database.js)

---

### B. Event-Driven Architecture

#### 1. What it means:
Event-Driven Architecture (EDA) is a software design pattern where decoupled software components communicate by producing, detecting, and reacting to significant state changes ("events") rather than invoking direct, tightly coupled synchronous function chains.

#### 2. Where it is implemented in Banana Brain:
Banana Brain uses events across **both the Presentation Tier and the Application Tier**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       1. PRESENTATION TIER (Browser)                        │
│                                                                             │
│   • Button Click (0-9 numpad)  ──>  Triggers DOM 'click' listener           │
│   • Keyboard (0-9, Enter)      ──>  Triggers window 'keydown' listener      │
│   • 180s Countdown Timer       ──>  Triggers 1000ms setInterval tick        │
│   • Timer reaches 0s           ──>  Triggers 'game:timeout' event           │
│   • Client Event Bus           ──>  'game:challenge-loaded'                 │
│     (public/js/event-bus.js)        'game:answer-result'                    │
│                                     'ui:toast'                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP POST /api/game/challenges/:id/answer
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        2. APPLICATION TIER (Node.js)                        │
│                                                                             │
│   Node.js EventEmitter         ──>  'challenge.started'                     │
│   (src/events/event-emitter.js)     'answer.submitted'                      │
│                                     'challenge.completed'                   │
│                                     'score.updated'                         │
│                                     'user.registered'                       │
│                                                                             │
│   Event Handlers               ──>  Logs telemetry, records audit trail to  │
│   (src/events/event-handlers.js)    game_attempts, updates leaderboards.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Client-Side Triggers:
1. **DOM User Input Events** ([`public/js/game.js`](file:///c:/Users/sujal/Desktop/SFE/public/js/game.js)):
   - Clicking numeric buttons (`[data-key]`) triggers `click` events to update the answer preview.
   - Clicking `#btn-submit` triggers submission and disables input.
   - Pressing keys `0–9` or `Enter` triggers window `keydown` listeners.
2. **Temporal Timer Events**:
   - `setInterval` fires every 1,000ms to decrement the 180s timer and animate the progress bar.
   - Reaching `0` fires `handleTimeExpired()`, dispatching `game:timeout`, locking the UI, and resetting streaks.
3. **Client Pub/Sub Event Bus** ([`public/js/event-bus.js`](file:///c:/Users/sujal/Desktop/SFE/public/js/event-bus.js)):
   - Custom `ClientEventBus` allows UI components to react to events without direct coupling (e.g. `eventBus.emit('game:answer-result', data)` triggers audio sounds, celebratory confetti, and HUD score animations).

#### Server-Side Domain Events:
Built with Node.js native `EventEmitter` ([`src/events/event-emitter.js`](file:///c:/Users/sujal/Desktop/SFE/src/events/event-emitter.js)):
- **`challenge.started`**: Fired in [`game.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/game.service.js) when a puzzle is fetched; records game session telemetry.
- **`answer.submitted`**: Fired when player inputs a guess; logs reaction time ($ms$) and player guess.
- **`challenge.completed`**: Fired after verifying answer; writes an immutable record to `game_attempts` and calculates win/loss metrics.
- **`score.updated`**: Fired when score changes; recalculates global leaderboard positions.
- **`user.registered`**: Fired in [`auth.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/auth.service.js) to initialize player metrics.

---

### C. Virtual Identity

#### 1. What it means:
Virtual Identity is the representation of an actor within a digital environment, defining their unique identity, cryptographic credentials, authenticated state across stateless protocols, access privileges, and verifiable audit history.

#### 2. Where it is implemented in Banana Brain:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VIRTUAL IDENTITY ENGINE                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. Relational Entity │ 2. Cryptography      │ 3. Stateful Session Cookies   │
│    • Unique Username │    • bcryptjs        │    • express-session          │
│    • Unique Email    │    • 10 Salt Rounds  │    • HttpOnly = true (No XSS) │
│    • Custom Avatar   │    • Zero Plaintext  │    • SameSite = Lax (Anti-CSRF│
│    • Player Bio      │    • Hash Redaction  │    • Session Regeneration     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 4. Network Security  │ 5. IDOR Protection   │ 6. Auditing & History         │
│    • IP Rate Limits  │    • user_id Check   │    • Permanent Attempts Log   │
│    • 10 req / 15 min │    • 403 Forbidden   │    • Win/Loss Non-Repudiation │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Relational Persona (`users` & `user_stats` tables)**:
   - Unique `username` (case-insensitive handle).
   - Unique `email` (account ownership).
   - Customizable `display_name`, `bio`, and `avatar_color` palette (e.g. `#F59E0B`, `#3B82F6`).
   - 1-to-1 relational link to `user_stats` (tracking cumulative score, games played, accuracy %, and best streaks).
2. **Cryptographic Password Protection** ([`src/services/auth.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/auth.service.js)):
   - Passwords are salted with 10 rounds of salt (`bcrypt.genSalt(10)`) and hashed with `bcryptjs`.
   - Verified in constant time via `bcrypt.compare()` to defeat timing attacks.
   - Plaintext passwords are never saved, never logged, and stripped from all return models (`delete sanitized.password_hash`).
3. **Stateful Session Cookies** ([`src/app.js`](file:///c:/Users/sujal/Desktop/SFE/src/app.js)):
   - Powered by `express-session` with signed cookie tokens (`banana_brain_sid`).
   - `httpOnly: true`: Completely blocks JavaScript access (`document.cookie`), immunizing the app against XSS session theft.
   - `sameSite: 'lax'`: Mitigates Cross-Site Request Forgery.
   - **Session Fixation Defense**: `req.session.regenerate()` is executed upon login to replace the session token.
4. **Anti-CSRF Protection** ([`src/middleware/csrf.middleware.js`](file:///c:/Users/sujal/Desktop/SFE/src/middleware/csrf.middleware.js)):
   - Generates anti-CSRF tokens and verifies the `X-CSRF-Token` header on state-altering requests (`POST`, `PUT`, `DELETE`).
5. **Anti-IDOR (Insecure Direct Object Reference) Protection** ([`src/services/game.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/game.service.js)):
   - Strict ownership check: `if (challenge.user_id !== userId) throw 403 Forbidden`. A player cannot submit answers to another user's challenge.
6. **IP Monitoring & Rate Limiting** ([`src/middleware/rate-limit.middleware.js`](file:///c:/Users/sujal/Desktop/SFE/src/middleware/rate-limit.middleware.js)):
   - Tracks client IP addresses via `req.ip` and restricts authentication attempts to 10 requests per 15-minute window to defeat brute-force dictionary attacks.
7. **Verifiable Audit History (`game_attempts` table)**:
   - Every puzzle attempt is permanently tied to `user_id`, logging selected answer, reaction time, points awarded, and timestamp.

---

## 2. Step-by-Step: How to Show Your Teacher (Live Demo Script)

Follow this exact script when presenting your project.

### Pre-Demo Setup
1. **Ensure MySQL and Apache are running in XAMPP** (or let the app use SQLite auto-fallback).
2. Open your terminal in `c:\Users\sujal\Desktop\SFE`:
   ```bash
   npm run dev
   ```
3. Open your browser at: [**http://localhost:3000**](http://localhost:3000)
4. Open your browser's **Developer Tools** (Press `F12` or `Ctrl + Shift + I`).

---

### Demo Step 1: Virtual Identity Demonstration

#### 🎯 Goal: Prove real user authentication, password encryption, secure session cookies, and IDOR protection.

#### 1. What to show on screen:
- Go to [http://localhost:3000/login.html](http://localhost:3000/login.html).
- Log in with the pre-seeded demo identity:
  - **Username**: `demoplayer`
  - **Password**: `Banana123!`
- Show that the navigation bar updates with the player's personalized avatar color badge, display name, and live score.
- Click on **Profile** in the navbar to show the profile screen (`/profile.html`). Show the player's personal metrics (Total Score, Accuracy %, Best Streak) and historical attempts table.

#### 2. What to show in Browser DevTools:
- In DevTools, click the **Application** (or **Storage**) tab.
- Click **Cookies** $\rightarrow$ `http://localhost:3000`.
- Point your finger at the cookie named **`banana_brain_sid`**:
  - Show the column **`HttpOnly`** has a checkmark (`true`).
  - Show the column **`SameSite`** is set to `Lax`.
- Open the DevTools **Console** tab and type:
  ```javascript
  document.cookie
  ```
  Press Enter. Show that `banana_brain_sid` does NOT appear!

#### 3. What code to open in VS Code:
- Open [`src/services/auth.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/auth.service.js) at line 60:
  ```javascript
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  ```
- Open [`src/app.js`](file:///c:/Users/sujal/Desktop/SFE/src/app.js) at line 48:
  ```javascript
  session({
    name: env.SESSION_NAME,
    cookie: { httpOnly: true, sameSite: 'lax', secure: env.COOKIE_SECURE }
  })
  ```
- Open [`src/services/game.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/game.service.js) at line 76:
  ```javascript
  // Anti-IDOR Authorization guard
  if (challenge.user_id !== userId) {
    throw new Error('Forbidden: You do not have authorization to answer this challenge');
  }
  ```

#### 4. Optional: Show phpMyAdmin
- Open [http://localhost/phpmyadmin/index.php?route=/sql&db=banana_brain&table=users](http://localhost/phpmyadmin/index.php?route=/sql&db=banana_brain&table=users).
- Show the `users` table: show that `password_hash` contains a bcrypt hash starting with `$2a$10$...` and plaintext passwords are never stored.

#### 🗣️ What to say to your teacher:
> *"Here is our Virtual Identity system. Every player has a persistent relational identity. We salt and hash passwords using bcrypt with 10 rounds so credentials are never stored in plaintext. We manage identity across stateless HTTP using express-session with HttpOnly cookies—as you can see in DevTools, document.cookie cannot read the session token, neutralizing Cross-Site Scripting (XSS) session theft. Furthermore, in our game service, we enforce Anti-IDOR checks to ensure players cannot access or answer anyone else's challenge."*

---

### Demo Step 2: Interoperability & Banana API Demonstration

#### 🎯 Goal: Prove external microservice communication with Dr. Conrad's API and show that the secret answer is NEVER leaked to the client.

#### 1. What to show on screen:
- Go to the game screen: [http://localhost:3000/game.html](http://localhost:3000/game.html).
- Open the **Network** tab in Developer Tools.
- Filter by `Fetch/XHR`.
- Click **"Next Puzzle"** (or refresh to load a puzzle).
- In the Network tab, click on the request to: `POST /api/game/challenges`.
- Look at the **Response** tab. Show the JSON payload:
  ```json
  {
    "success": true,
    "challenge": {
      "id": "e3a89041-3b70-4bc8-8e64-f6adab29408e",
      "imageUrl": "https://www.sanfoh.com/uob/banana/data/...",
      "expiresAt": "2026-11-03T08:15:00.000Z"
    }
  }
  ```
- **Point out to your teacher**:
  *"Notice that the solution is MISSING! The player's browser has NO WAY to cheat by inspecting network traffic or JavaScript variables."*

#### 2. What code to open in VS Code:
- Open [`src/services/banana-api.service.js`](file:///c:/Users/sujal/Desktop/SFE/src/services/banana-api.service.js):
  - **Line 18**: Show the canonical endpoint: `https://marcconrad.com/uob/banana/api.php?out=json`.
  - **Line 31–43**: Show `AbortController` 8-second timeout and `redirect: 'follow'` for 301 redirects:
    ```javascript
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    const response = await fetch(url.toString(), { redirect: 'follow', signal: controller.signal });
    ```
  - **Line 89**: Show `validateApiResponse(data)`: validates schema contract `{ question, solution }`.
  - **Line 71**: Show offline fallback fixtures (`FALLBACK_PUZZLES`) for graceful degradation if the university API server experiences outages.
  - **Line 110**: Show `createChallenge()`: stores `solution` strictly server-side.

#### 3. Show Relational Database Interoperability:
- Open [`src/config/database.js`](file:///c:/Users/sujal/Desktop/SFE/src/config/database.js):
  - Show how the backend interoperates with MariaDB/MySQL over TCP port 3306 using `mysql2` and with SQLite using `node:sqlite`.

#### 🗣️ What to say to your teacher:
> *"Here is our Interoperability implementation. We demonstrate it across three boundaries: first, RESTful JSON between the browser and backend. Second, outbound HTTPS integration with Dr. Marc Conrad's Banana API microservice. Notice how our adapter follows HTTP 301 redirects, enforces an 8-second AbortController timeout, and validates the external contract schema. Crucially, as you can see in the browser Network tab, our backend intercepts the puzzle solution and keeps it strictly on the server—preventing client-side cheating. Third, we demonstrate database interoperability with MariaDB via TCP port 3306 and SQLite."*

---

### Demo Step 3: Event-Driven Architecture Demonstration

#### 🎯 Goal: Prove asynchronous, decoupled event handling on both frontend and backend.

#### 1. What to show on screen & in Terminal:
- Place your browser window and your terminal running `npm run dev` side-by-side so your teacher can see both.
- On the game screen ([http://localhost:3000/game.html](http://localhost:3000/game.html)):
  - **DOM Events**: Click on number pad key `5` (or press `5` on your physical keyboard). Show how the input and GUI react instantly.
  - **Timer Event**: Point to the 180-second countdown bar. Explain that a 1-second recurring `setInterval` event updates the bar and will trigger a `game:timeout` event if it hits zero.
  - **Submit Answer**: Click **Submit Guess** (or press `Enter`).
- Look at the terminal running `npm run dev`:
  Show the live domain events logged in real time:
  ```
  [INFO] [Event: challenge.started] Challenge initiated | {"challengeId":"..."}
  [INFO] [Event: answer.submitted] Answer submitted | {"challengeId":"...","isCorrect":true}
  [INFO] [Event: challenge.completed] Challenge concluded | {"pointsAwarded":160,"currentStreak":1}
  [INFO] [Event: score.updated] Player score updated | {"newTotalScore":160}
  ```

#### 2. What code to open in VS Code:
- Open [`public/js/event-bus.js`](file:///c:/Users/sujal/Desktop/SFE/public/js/event-bus.js):
  - Show `ClientEventBus` with `.on()`, `.off()`, and `.emit()`.
- Open [`public/js/game.js`](file:///c:/Users/sujal/Desktop/SFE/public/js/game.js):
  - **Line 58–67**: Show numpad `click` event listeners.
  - **Line 70–93**: Show physical `keydown` keyboard listeners (`0-9`, `Enter`, `Space`).
  - **Line 163**: Show 180s countdown `setInterval` and `handleTimeExpired()`.
- Open [`src/events/event-emitter.js`](file:///c:/Users/sujal/Desktop/SFE/src/events/event-emitter.js):
  - Show Node's `EventEmitter` instance `eventBus` and `DOMAIN_EVENTS` constants.
- Open [`src/events/event-handlers.js`](file:///c:/Users/sujal/Desktop/SFE/src/events/event-handlers.js):
  - Show how domain events trigger telemetry logging, attempt audits, and score updates asynchronously.

#### 🗣️ What to say to your teacher:
> *"Here is our Event-Driven Architecture. In the presentation tier, we handle user click events on the numpad, keyboard events for quick number entry, and a 1000ms timer interval that fires a timeout event on expiration. On the backend, we use Node.js EventEmitter. When an answer is submitted, the game service emits domain events like 'answer.submitted', 'challenge.completed', and 'score.updated'. As you can see in the terminal, these events trigger audit recording and leaderboard recalculation asynchronously without blocking or tightly coupling the core game logic."*

---

### Demo Step 4: Automated Testing & Verification

#### 🎯 Goal: Prove automated verification and software quality.

1. Open your terminal and run:
   ```bash
   npm test
   ```
2. Show the output:
   - **24 tests passed**
   - **5 test suites**
   - **0 failures**
   - **Execution time: ~2 seconds**
3. Point out the 5 suites:
   - `Scoring & Streak Engine Unit Tests` (6 tests)
   - `Validation & Contract Rules Unit Tests` (5 tests)
   - `Virtual Identity & Authentication Integration Tests` (5 tests)
   - `Game Loop & Solution Confidentiality Integration Tests` (5 tests)
   - `Banana API Interoperability & Adapter Tests` (3 tests)

---

## 3. Teacher Q&A Cheat Sheet (Instant Answers)

### Q1: "Do you use the Tomato API (`/uob/tomato/api.php`)?"
> **Your Answer**: *"No, our coursework specification uses Dr. Marc Conrad's official Banana API at `/uob/banana/api.php?out=json`. Both microservices share identical architecture and JSON schema conventions. We also built resilient fallback fixtures into our adapter so the game continues running even during external university network downtime."*

### Q2: "How do you prevent players from cheating and finding the answer in DevTools?"
> **Your Answer**: *"In our `game.service.js` and `banana-api.service.js`, the backend intercepts Dr. Conrad's API response, strips the `solution` property, and saves it in a server-side relational database record indexed by a random UUID. We only send the image URL and challenge UUID to the browser. The answer is evaluated strictly on the server when the user submits their guess."*

### Q3: "What prevents someone from answering another player's challenge (IDOR)?"
> **Your Answer**: *"Every challenge record has a `user_id` foreign key. In `game.service.js`, we verify `challenge.user_id === req.user.id`. If another user attempts to submit an answer to that challenge UUID, the server rejects it with HTTP 403 Forbidden."*

### Q4: "How is your database structured?"
> **Your Answer**: *"We designed a dual-driver relational architecture in `src/config/database.js`. We support zero-configuration SQLite for instant evaluation, and MariaDB/MySQL in XAMPP for inspection in phpMyAdmin. Both use parameterized queries to prevent SQL injection across all 5 tables: users, user_stats, game_sessions, challenges, and game_attempts."*

### Q5: "How does your scoring engine calculate points?"
> **Your Answer**: *"Scoring is authoritative on the server: 100 Base Points for a correct answer, plus a Speed Bonus (<10s is +50 points, <20s is +30 points, <30s is +15 points), plus a consecutive Streak Bonus of +10 points per puzzle up to +100 points maximum. Any mistake or timeout immediately breaks the streak back to 0."*
