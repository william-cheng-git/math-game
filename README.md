# Math Blast! 🚀 Kid-Friendly Arithmetic Adventure

A complete, self-contained, kid-friendly web game for practicing simple arithmetic. Built with pure client-side HTML, CSS, and vanilla JavaScript—zero backend or build tools required. It runs out of the box when pushed to a GitHub repository and hosted on **GitHub Pages**.

![Math Blast Screenshot Preview](https://img.shields.io/badge/Platform-GitHub%20Pages-blue?style=for-the-badge&logo=github)
![Pure JavaScript](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-success?style=for-the-badge&logo=javascript)
![Zero Backend](https://img.shields.io/badge/Backend-Zero%20(Pure%20Client--Side)-orange?style=for-the-badge)

---

## 🌟 Key Features

### 1. 🎯 Visual Configuration Screen
- **Difficulty Presets:**
  - **🌱 Easy (Starter):** Single-digit addition and subtraction ($a \ge b$, non-negative results for young learners).
  - **⚡ Medium (Explorer):** Numbers up to 20 with addition, subtraction, and friendly multiplication tables ($2\times, 3\times, 4\times, 5\times, 10\times$).
  - **🏆 Hard (Champion):** Numbers up to 100 with addition, subtraction, multiplication up to $12 \times 12$, and exact division with zero remainders.
  - **⚙️ Custom:** Build your own game rules! Freely toggle operations and set number ranges.
- **Operations Toggles:** Fast toggle checkboxes for Addition (`+`), Subtraction (`−`), Multiplication (`×`), and Division (`÷`).
- **Flexible Round Timers:** Quick chips for 30s (Sprint), 60s (Standard), 90s (Endurance), 120s (Marathon), or custom seconds.

### 2. ⭐ Dynamic Level Progression & Adaptive Difficulty
- **Real-Time Leveling Up:** As players score points, their level rises from **Level 1 (Apprentice)** up through **Explorer, Adventurer, Champion, Master, and Legend**.
- **Level-Up Celebrations:** Crossing level thresholds triggers a golden animated level-up banner, celebratory fanfare, confetti bursts, and awards **+5s extra bonus time** on the clock.
- **Adaptive Difficulty:** Math questions dynamically scale with the player's level—introducing carrying/borrowing, higher times tables, and larger numbers as kids improve.
- **Max Level Saved:** Tracks and celebrates the highest level reached on the round summary and in session history.

### 3. 🔥 Long Streak Bonuses & Milestone Celebrations (5, 10, 20, 50, 100)
- **High-Streak Multipliers:** Consecutive correct answers award climbing score multipliers (up to 4.0x for 100+ streak).
- **Streak Achievement Milestones:**
  - **🔥 5 In A Row (Super Streak):** +25 bonus points & animated celebratory banner.
  - **⚡ 10 In A Row (Unstoppable):** +50 bonus points & 2.0x multiplier.
  - **🌟 20 In A Row (Math Master):** +100 bonus points & starburst fanfare.
  - **🚀 50 In A Row (Legendary Hero):** +250 bonus points & grand confetti explosion.
  - **👑 100 In A Row (Mythic Godlike):** +500 bonus points & triumphant fanfare.

### 4. ⏱️ Urgency Countdown Clock & Bonus Seconds System
- **Countdown Clock with Visual Urgency Cues:**
  - Standard soothing theme when time $> 15\text{s}$.
  - Warning amber state when time $\le 15\text{s}$.
  - Urgent pulsating red animation with subtle audio cues when time $\le 5\text{s}$.
- **Bonus Time for Harder Questions:**
  - Questions are dynamically classified into 5 difficulty tiers based on operations, level, number sizes, and regrouping.
  - Correct answers reward **bonus seconds** (`+1s` up to `+5s`) and bonus points, encouraging careful problem-solving rather than reckless guessing.
  - Floating visual notification badges (`+3s! ⏱️`, `+35 pts!`) animate in real-time.

### 5. 👶 Kid-Friendly Arithmetic UX & Anti-Spam Protection
- **Debounced Input & Rapid-Enter Protection:** Completely prevents accidental double-scoring or repeated submissions when hitting Enter quickly.
- **Chunky On-Screen Keypad:** Large touch targets designed specifically for tablets and mobile touchscreens (`1`–`9`, `0`, `Clear`, `⌫ Backspace`, `⏭️ Skip`, `GO!`).
- **Full Physical Keyboard Support:** Desktop users can type numbers `0`–`9`, `Backspace`, `Enter` to submit, `C` to clear, and `S` to skip.
- **Positive, Non-Punitive Feedback:** Cheerful visual badges, encouraging messages ("Awesome!", "Nice try! Keep going!"), and gentle animations that motivate kids without harsh punishment.
- **Built-in Web Audio API Synthesizer:** Real-time musical arpeggios, tap clicks, power-up chimes, level-up fanfares, and victory melodies generated via browser audio synthesis—**zero external audio asset files to load, zero 404/CORS issues, and 100% offline-ready** (includes persistent mute toggle).

### 4. 🍪 Cookie Persistence & LocalStorage Fallback
- Persists all past game records (timestamp, preset, score, accuracy %, correct/missed counts, duration, and bonus time earned) and personal bests in **browser cookies** (`SameSite=Lax`, 365-day persistence).
- Features automatic **`localStorage` dual-sync and fallback**: safeguards against browser cookie blocks and respects the 4KB per-cookie size limit by keeping recent records in cookies while storing complete history in `localStorage`.
- Includes a built-in "Clear History" confirmation tool to reset data anytime.

### 5. 🏆 High-Score Celebration
- Automatically detects when a player sets a new high score for any difficulty preset.
- Triggers celebratory confetti blasts, animated starbursts, a golden trophy banner, and a victory fanfare on the summary screen.

### 6. 📊 Accuracy Rate Pie Chart & Long-Term Trend Graphs
- **Accuracy Breakdown:** Renders a clean doughnut/pie chart showing Correct vs. Missed/Skipped with accuracy percentages (powered by Chart.js with an automatic SVG fallback for offline/air-gapped use).
- **Progress Trend Graphs:** Visualizes score progression and accuracy percentage over recent rounds so kids and parents can watch math skills improve over time.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

This game requires **zero server configuration, zero node packages, and zero build commands**. You can deploy it directly from your GitHub repository in under 2 minutes:

### Step 1: Push Code to GitHub
Ensure `index.html`, `styles.css`, `app.js`, and `README.md` are in the root directory of your repository on the `main` branch:

```bash
git add .
git commit -m "Initial commit of Math Blast game"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Open your repository on GitHub (`https://github.com/<your-username>/<your-repo-name>`).
2. Click on the **Settings** tab near the top right.
3. In the left-hand navigation menu, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source:** Select `Deploy from a branch`.
   - **Branch:** Select `main` (or your default branch) and leave the folder set to `/ (root)`.
5. Click **Save**.

### Step 3: Access Your Live Game
Within 1–2 minutes, GitHub Pages will deploy your site. Your game URL will be displayed at the top of the Pages settings page:
```
https://<your-username>.github.io/<your-repo-name>/
```

---

## 💻 Running & Testing Locally

Because this project uses standard browser APIs and relative paths, you can test it locally using any static web server:

### Option A: Python 3 (Recommended)
```bash
python3 -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your web browser.

### Option B: Node.js `npx serve`
```bash
npx serve .
```

### Option C: Direct File Access
You can also directly double-click `index.html` to open it in Chrome, Safari, Edge, or Firefox. (Note: For cookie persistence and audio permissions, running via `http://localhost` is recommended by browser security policies).

---

## 📁 Project Structure

```
math-game/
├── index.html       # Semantic HTML5 markup, views, keypad, HUD, modals
├── styles.css       # Responsive, kid-friendly high-contrast styles & animations
├── app.js           # Game engine, math generator, sound synth, charts & storage
└── README.md        # Deployment and usage documentation
```

---

## 🛡️ Privacy & Kid Safety
- **100% Client-Side:** No user data or analytics are sent to any remote server.
- **No Ads, No Tracking:** Safe for classroom and home use.
- **Local Device Storage:** Scores and trends remain solely inside the player's browser cookies / `localStorage`.

---

## 📄 License
MIT License. Feel free to use, adapt, and share with students, children, and schools!
