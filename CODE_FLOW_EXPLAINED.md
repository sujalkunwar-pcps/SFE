# 🗺️ Banana Brain — Code Flow & Architecture Map
**Student:** Sujal Kunwar (`sujal.kunwar@patancollege.edu.np`)  
**Purpose:** Use this guide during your viva/presentation so you know **exactly** which file calls which file, how data flows through the system, and how to explain it effortlessly to your teacher.

---

## 🪜 The Golden Rule: The 5-Step Ladder

Every single action in Banana Brain follows the exact same **5-step ladder**:

```
[1. Browser UI]  ───(Sends HTTP Request)───>  [2. Routes]
                                                    │
                                                    ▼
                                              [3. Controllers]
                                                    │
                                                    ▼
                                              [4. Services]
                                                    │
                                                    ▼
                                              [5. Repositories / DB]
```

### What each step does in 1 sentence:
1. **Browser (`public/`)**: The user clicks a button or types something on screen.
2. **Routes (`src/routes/`)**: The traffic police. It hears the URL (e.g., `/api/game/challenges`) and directs it to the right controller.
3. **Controllers (`src/controllers/`)**: The receptionist. It checks if the user provided the right data (validating inputs).
4. **Services (`src/services/`)**: The brain! This is where all the real business logic happens (calling Dr. Conrad's API, calculating scores, hashing passwords, firing events).
5. **Repositories & Database (`src/repositories/` & `src/config/database.js`)**: The vault. It runs SQL queries to save and load data from MySQL (XAMPP) or SQLite.

---

## 🔄 Flow 1: How Login Works (Step-by-Step)

When a player types their username and password and clicks "Login":

```
[public/login.html] User enters username & password, clicks "Log In"
        │
        ▼
[public/js/auth.js] Catches form submit event, packages data into JSON
        │
        ▼
[public/js/api-client.js] Sends HTTP POST request to "/api/auth/login"
        │
        ▼
[src/routes/auth.routes.js] Directs POST "/login" to authController.login
        │
        ▼
[src/controllers/auth.controller.js] Checks that username and password are not empty
        │
        ▼
[src/services/auth.service.js]
  • Calls userRepository to find user in DB
  • Calls bcrypt.compare() to check encrypted password hash
  • If valid, regenerates session and creates session cookie (banana_brain_sid)
        │
        ▼
[src/repositories/user.repository.js]
  • Runs SQL query: SELECT * FROM users WHERE LOWER(username) = LOWER(?)
        │
        ▼
[src/config/database.js] Executes query on MySQL (port 3306) or SQLite
        │
        ▼
[Browser] Receives { success: true, user } and HttpOnly cookie -> Redirects to game arena!
```

---

## 🎮 Flow 2: How a Puzzle is Loaded (Step-by-Step)

When a player opens the game or clicks "Next Puzzle":

```
[public/game.html] Player clicks "Next Puzzle"
        │
        ▼
[public/js/game.js] Calls api.post('/api/game/challenges')
        │
        ▼
[src/routes/game.routes.js] Directs POST "/challenges" to gameController.getChallenge
        │
        ▼
[src/controllers/game.controller.js] Checks user session -> Calls gameService.startChallenge()
        │
        ▼
[src/services/game.service.js]
  • Asks bananaApiService to get a new puzzle
        │
        ▼
[src/services/banana-api.service.js] (INTEROPERABILITY BOUNDARY!)
  • Sends HTTPS request to: https://marcconrad.com/uob/banana/api.php?out=json
  • Follows 301 redirects, enforces 8s AbortController timeout
  • Dr. Marc Conrad's API responds with: { question: "image_url", solution: 8 }
  • Returns data back to game.service.js
        │
        ▼
[src/services/game.service.js] (ANTI-CHEAT SECURITY INVARIANT!)
  • Generates a random UUID (challengeId)
  • Calls challengeRepository to SAVE the solution (8) safely in the database!
  • STRIPS the solution from the return object!
  • Emits domain event: challenge.started
        │
        ▼
[src/repositories/challenge.repository.js]
  • Inserts challenge record: INSERT INTO challenges (id, user_id, image_url, solution, expires_at)
        │
        ▼
[Browser] Receives ONLY: { id: "uuid", imageUrl: "https://..." } (NO SOLUTION!)
        │
        ▼
[public/js/game.js] Renders the puzzle image and starts the 180s countdown timer!
```

---

## 🎯 Flow 3: How Submitting an Answer Works (Step-by-Step)

When a player clicks a number (e.g., `8`) and submits their guess:

```
[public/game.html] Player clicks "8" on keypad -> Clicks "Submit Guess"
        │
        ▼
[public/js/game.js] Calls api.post('/api/game/challenges/:id/answer', { answer: 8 })
        │
        ▼
[src/routes/game.routes.js] Directs request to gameController.submitAnswer
        │
        ▼
[src/controllers/game.controller.js] Validates that answer is a number 0-9 -> Calls gameService.submitAnswer()
        │
        ▼
[src/services/game.service.js] (AUTHORITATIVE EVALUATION & ANTI-IDOR)
  1. Finds challenge in DB using challengeId
  2. ANTI-IDOR CHECK: Verifies challenge.user_id === req.user.id (Cannot answer someone else's puzzle!)
  3. ANTI-CHEAT REPLAY: Verifies challenge.is_completed === 0 (Cannot answer twice!)
  4. TIMEOUT CHECK: Verifies now < expiresAt (Cannot answer after 180 seconds!)
  5. EVALUATES ANSWER: Checks if (userAnswer === challenge.solution)
  6. CALCULATES SCORE:
     • Base Points = 100
     • Speed Bonus = +50 (if <10s), +30 (if <20s), +15 (if <30s)
     • Streak Bonus = +10 per win up to +100
  7. EMITS BACKEND EVENTS:
     • eventBus.emit('challenge.completed') -> Writes to game_attempts table
     • eventBus.emit('score.updated') -> Updates leaderboard
        │
        ▼
[src/events/event-handlers.js] (EVENT-DRIVEN ARCHITECTURE)
  • Catches domain events and logs them to terminal live:
    [INFO] [Event: answer.submitted]
    [INFO] [Event: challenge.completed] Points awarded: 160
    [INFO] [Event: score.updated] Total score: 1,450
        │
        ▼
[src/repositories/user.repository.js] Updates user_stats table in database with new total score
        │
        ▼
[Browser] Receives { success: true, correct: true, pointsAwarded: 160, currentStreak: 1 }
        │
        ▼
[public/js/game.js]
  • Triggers client event: game:answer-result
  • Shows green celebration banner, plays sound, updates HUD score!
```

---

## 🗂️ File Directory Cheat Sheet ("Where is Everything?")

If your teacher points to any feature and asks *"Show me where this code lives"*, use this quick table:

| Teacher Asks... | Open This Exact File: | What Line / Function: |
|---|---|---|
| **"Where do you call Dr. Conrad's Banana API?"** | `src/services/banana-api.service.js` | Line 18 (`baseUrl`), Line 27 (`fetchRawPuzzle()`) |
| **"Where do you prevent cheating / hide the answer?"** | `src/services/banana-api.service.js` & `src/services/game.service.js` | Line 110 (`createChallenge()`) |
| **"Where do you hash passwords with bcrypt?"** | `src/services/auth.service.js` | Line 60 (`bcrypt.genSalt(10)`, `bcrypt.hash`) |
| **"Where is the session cookie configured?"** | `src/app.js` | Line 48 (`session({ cookie: { httpOnly: true } })`) |
| **"Where do you prevent players from hacking other players (IDOR)?"** | `src/services/game.service.js` | Line 76 (`if (challenge.user_id !== userId) throw 403`) |
| **"Where is the score, speed bonus, and streak calculated?"** | `src/services/game.service.js` | Line 106–135 (`submitAnswer()`) |
| **"Where are the backend domain events (EventEmitter)?"** | `src/events/event-emitter.js` & `src/events/event-handlers.js` | Line 18 (`DOMAIN_EVENTS`), Line 9–45 (event handlers) |
| **"Where is the frontend numpad and 180s countdown timer?"** | `public/js/game.js` | Line 59 (keypad clicks), Line 158 (`startTimer()`) |
| **"Where is the frontend Pub/Sub event bus?"** | `public/js/event-bus.js` | Line 6 (`ClientEventBus` `.on()`, `.emit()`) |
| **"Where is the database connection for MySQL and SQLite?"** | `src/config/database.js` | Line 21 (`init()` connects to port 3306 or SQLite) |
| **"Where are the SQL database tables defined?"** | `src/database/schema-mysql.sql` | `users`, `user_stats`, `game_sessions`, `challenges`, `game_attempts` |
| **"Where are the automated tests?"** | `tests/test-runner.js` | Run `npm test` in terminal (24 tests pass) |

---

## 🎤 The 30-Second Speech to Give Your Teacher

If your teacher says: *"Explain the architecture and flow of your application"*, say this:

> *"Our application uses a clean 3-Tier Distributed Architecture following a 5-step flow:*  
> *1. The **Browser** in `public/` sends JSON requests.*  
> *2. The **Routes** in `src/routes/` direct requests to the right **Controller**.*  
> *3. The **Controller** validates the user input.*  
> *4. The **Service** in `src/services/` executes the core business logic—such as calling Dr. Marc Conrad's external Banana API over HTTPS, hashing passwords with bcrypt, and calculating speed and streak bonuses.*  
> *5. The **Repository** in `src/repositories/` executes parameterized SQL queries on our MySQL or SQLite database.*  
>  
> *Throughout this flow, everything is event-driven: user clicks and a 180s countdown timer drive the frontend, while Node's EventEmitter logs telemetry and recalculates leaderboards on the backend. Most importantly, the solution from Dr. Conrad's API is held securely on the server so no player can cheat."*
