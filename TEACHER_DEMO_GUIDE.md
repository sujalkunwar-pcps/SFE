# 🍌 Banana Brain — Simple Teacher Demo & Explanation Guide
**For:** University of Bedfordshire Software Engineering Coursework Viva  
**Student:** Sujal Kunwar  
**Project:** Banana Brain  

---

## 💡 Part 1: Simple Explanations (What are these 3 things?)

### 1. Interoperability (Simple Explanation)
- **What it means in plain English:**  
  *"Interoperability just means two different computer programs talking to each other and sharing data over the internet."*
- **How it works in our code:**
  - **Boundary 1 (Browser $\leftrightarrow$ Backend):** Your web browser talks to your Express backend using simple JSON messages.
  - **Boundary 2 (Backend $\leftrightarrow$ Dr. Conrad's Banana API):** Your backend calls Dr. Marc Conrad's live server (`https://marcconrad.com/uob/banana/api.php?out=json`) to fetch a visual puzzle.
  - **Boundary 3 (Backend $\leftrightarrow$ Database):** Your backend connects to MySQL (in XAMPP) or SQLite to save user scores.
- **The smart feature to highlight to your teacher:**  
  When Dr. Conrad's API sends us the puzzle, it sends **both** the image URL AND the solution (e.g. `solution: 8`).  
  **If we sent that answer to the browser, any student could open Inspect Element and cheat!**  
  So our server **hides the answer** inside the database and only sends the image to the player. The browser never sees the answer until the player submits their guess!

---

### 2. Event-Driven Architecture (Simple Explanation)
- **What it means in plain English:**  
  *"Instead of running code in a straight line, the program sits waiting for something to happen (an event), and then reacts to it immediately."*
- **How it works in our code:**
  - **On the Frontend (Browser):**
    - **Click event:** When you click any number button (0–9), a `click` event selects the number.
    - **Keyboard event:** When you press a number on your physical keyboard or press `Enter`, a `keydown` event submits your guess.
    - **Timer event:** Every 1 second, a `setInterval` timer ticks down the 180-second clock. If it reaches 0, a `timeout` event fires and stops the game.
  - **On the Backend (Server):**
    - The server uses Node's `EventEmitter` to broadcast events in the background:
      1. `challenge.started` $\rightarrow$ when a puzzle loads.
      2. `answer.submitted` $\rightarrow$ when you submit a guess.
      3. `challenge.completed` $\rightarrow$ calculates points, speed bonus, and streaks.
      4. `score.updated` $\rightarrow$ updates the global leaderboard.
    - **You can see these events printing live in your terminal!**

---

### 3. Virtual Identity (Simple Explanation)
- **What it means in plain English:**  
  *"Virtual Identity means giving each player a safe, unique digital profile (account, password, avatar, score history) that cannot be stolen or hacked."*
- **How it works in our code:**
  - **Encrypted Passwords:** We NEVER save real passwords. We use **bcrypt** with 10 rounds of salt. A password like `Banana123!` becomes `$2a$10$e7x9...`. Even if someone hacks the database, they cannot read the password.
  - **Safe Session Cookies (`HttpOnly`):** When you log in, the server gives your browser a cookie named `banana_brain_sid`. We set `httpOnly: true`. That means malicious JavaScript in the browser **cannot** steal the cookie (protects against XSS attacks).
  - **Anti-Cheat (IDOR Protection):** Every puzzle is tied to the logged-in user. If Player A tries to guess the answer to Player B's puzzle, the server blocks them with `403 Forbidden`.
  - **Personal Profile:** Each user has their own avatar color, accuracy percentage, and history of past attempts.

---

## 🎬 Part 2: Step-by-Step Demo Script (What to show your teacher)

### ⏱️ Quick Setup (Before your teacher looks at your screen)
1. Open XAMPP and make sure **Apache** and **MySQL** are running (green).
2. Open your terminal in the project folder and run:
   ```bash
   npm run dev
   ```
3. Open your browser: [**http://localhost:3000**](http://localhost:3000)
4. Press **`F12`** on your keyboard to open **Developer Tools**.

---

### Step 1: Show Virtual Identity (Takes 1 minute)

1. **In the Browser:**
   - Go to [http://localhost:3000/login.html](http://localhost:3000/login.html).
   - Log in with:
     - **Username:** `demoplayer`
     - **Password:** `Banana123!`
   - Show the teacher: the top bar now shows the player's name, avatar icon, and score.
   - Click **Profile** in the menu: show the personal stats (Accuracy %, Best Streak, and game history).

2. **In Developer Tools (Press F12):**
   - Click the **Application** (or **Storage**) tab $\rightarrow$ click **Cookies** $\rightarrow$ `http://localhost:3000`.
   - Point your mouse to **`banana_brain_sid`**:
     - Point out the **`HttpOnly`** column: it has a checkmark (`true`).
   - Click the **Console** tab and type:
     ```javascript
     document.cookie
     ```
     Press Enter. Show your teacher that the session cookie does NOT appear!

3. **In VS Code (Code to show):**
   - Open `src/services/auth.service.js` line 60:
     ```javascript
     const salt = await bcrypt.genSalt(10);
     const passwordHash = await bcrypt.hash(password, salt);
     ```
   - Open `src/services/game.service.js` line 76:
     ```javascript
     if (challenge.user_id !== userId) {
       throw new Error('Forbidden: You do not have authorization to answer this challenge');
     }
     ```

4. **🗣️ Simple Words to Say to Your Teacher:**
   > *"Sir/Miss, this is our Virtual Identity. We don't store plain passwords—we encrypt them with salted bcrypt. We track logged-in users using HttpOnly cookies so JavaScript cannot steal them. And in `game.service.js`, we check that the player actually owns the puzzle they are answering so nobody can cheat."*

---

### Step 2: Show Interoperability (Takes 1 minute)

1. **In the Browser:**
   - Go to the game arena: [http://localhost:3000/game.html](http://localhost:3000/game.html).
   - In Developer Tools (F12), click the **Network** tab (click **Fetch/XHR** filter).
   - Click **"Next Puzzle"** (or refresh the page).
   - In the Network list, click on **`challenges`**.
   - Click the **Response** tab. Show the JSON:
     ```json
     {
       "success": true,
       "challenge": {
         "id": "e3a89041-...",
         "imageUrl": "https://www.sanfoh.com/uob/banana/data/...",
         "expiresAt": "..."
       }
     }
     ```
   - **Show your teacher:**  
     *"Notice the answer is missing! Dr. Marc Conrad's API gave us the answer, but our server removed it so the player cannot cheat by looking at the network tab!"*

2. **In VS Code (Code to show):**
   - Open `src/services/banana-api.service.js`:
     - **Line 18:** Show endpoint `https://marcconrad.com/uob/banana/api.php?out=json`.
     - **Line 32:** Show the 8-second timeout (`AbortController`) so the server doesn't freeze if the university internet is slow.
     - **Line 89:** Show `validateApiResponse()` checking that the data has a valid image and solution.
     - **Line 110:** Show `createChallenge()` saving the solution in the database, NOT sending it to the user.

3. **In phpMyAdmin (Optional):**
   - Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin) $\rightarrow$ database `banana_brain`.
   - Show the 5 tables: `users`, `user_stats`, `game_sessions`, `challenges`, `game_attempts`.
   - Explain: *"This shows interoperability between Node.js and MySQL on port 3306."*

4. **🗣️ Simple Words to Say to Your Teacher:**
   > *"Sir/Miss, this is Interoperability. Our Node.js backend talks directly to Dr. Marc Conrad's external Banana API over HTTPS. We follow redirects, set an 8-second timeout, and validate the data. Most importantly, our server hides the puzzle answer so players can't cheat. We also interoperate with MySQL in XAMPP to store the records."*

---

### Step 3: Show Event-Driven Architecture (Takes 1 minute)

1. **On Screen & In Terminal:**
   - Put your browser window on the left and your terminal window on the right so your teacher sees both.
   - **GUI Event:** On the game page, click any number on the on-screen keypad (`0–9`) or press a key on your keyboard. Show how the box updates immediately.
   - **Timer Event:** Point to the 180-second green progress bar. Explain that every 1 second, a timer event decrements the clock, and if it reaches zero, it triggers a game over event.
   - **Submit Guess:** Click **Submit Guess** (or press Enter).
   - **Live Terminal Events:** Point to your terminal! Show the live events that just printed:
     ```
     [INFO] [Event: challenge.started] Challenge initiated
     [INFO] [Event: answer.submitted] Answer submitted
     [INFO] [Event: challenge.completed] Challenge concluded
     [INFO] [Event: score.updated] Player score updated
     ```

2. **In VS Code (Code to show):**
   - Open `public/js/game.js`:
     - Line 59: Numpad click listeners.
     - Line 70: Keyboard `keydown` listeners (`0-9` and `Enter`).
     - Line 163: 1-second `setInterval` countdown timer.
   - Open `src/events/event-emitter.js`: Show the Node.js `EventEmitter`.
   - Open `src/events/event-handlers.js`: Show how events trigger logging and leaderboard updates without blocking the game.

3. **🗣️ Simple Words to Say to Your Teacher:**
   > *"Sir/Miss, this is our Event-Driven Architecture. On the frontend, the game listens for button clicks, keyboard typing, and a 1-second timer tick. On the backend, we use Node.js EventEmitter. When I submit an answer, the server fires events like 'answer.submitted' and 'challenge.completed'. As you can see right here in the terminal, these events calculate scores and update the leaderboard in the background."*

---

### Step 4: Run the Tests (Takes 10 seconds)
Open your terminal and type:
```bash
npm test
```
Show your teacher:
- **All 24 tests passed**
- **5 test suites passed**
- **0 failed**
- Runs in just 2 seconds!

---

## 🎯 Cheat Sheet: Quick Answers to Common Questions

| Question | Short 1-Sentence Answer |
|---|---|
| **"Do you use the Tomato API?"** | *"No, we use Dr. Marc Conrad's official Banana API at `/uob/banana/api.php?out=json` as specified in our coursework."* |
| **"How do you stop cheating?"** | *"Our backend strips the solution before sending the puzzle to the browser and stores it in the database."* |
| **"What if Dr. Conrad's server is down?"** | *"We built an offline fallback with sample puzzles in `banana-api.service.js` so the game never crashes."* |
| **"What database do you use?"** | *"We built a dual-driver system: it connects to MySQL in XAMPP on port 3306, and automatically falls back to SQLite if MySQL is off."* |
| **"How does scoring work?"** | *"100 base points for a correct answer, plus a speed bonus (up to +50 points under 10 seconds), plus a streak bonus (+10 points per win up to +100)."* |
