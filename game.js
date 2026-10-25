
"use strict";

/* ==========================================================
   TYPING MASTER — ADVANCED EDITION
   Plain JavaScript; no frameworks or backend required.
   ========================================================== */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "typingMasterAdvanced_v1";

const BANK = {
  easy: [
    "Practice makes progress every day.",
    "Small steps lead to big results.",
    "Keep calm and type with care.",
    "Learning grows with daily effort.",
    "Focus on accuracy before speed.",
    "Read each word and type it well.",
    "Stay patient and keep improving.",
    "Every lesson makes you stronger.",
    "Great work begins with practice.",
    "Good habits create better results.",
    "Believe in yourself and keep learning.",
    "A little practice goes a long way."
  ],
  medium: [
    "Consistent practice improves typing speed and accuracy.",
    "A clear mind helps you solve problems more efficiently.",
    "Technology becomes powerful when people use it wisely.",
    "Careful planning can turn difficult tasks into simple steps.",
    "Learning a new skill takes patience, focus, and repetition.",
    "Good programmers test their ideas and learn from mistakes.",
    "Time management helps students balance study and creativity.",
    "Accuracy is the foundation of fast and confident typing.",
    "Small improvements every day create meaningful progress.",
    "Strong habits make challenging goals easier to achieve.",
    "Creative thinking helps us discover new solutions to problems.",
    "The best way to improve is to practice consistently."
  ],
  hard: [
    "Great typists combine rhythm, precision, and consistency under pressure.",
    "Debugging requires patience: observe the problem, test a hypothesis, and verify the result.",
    "Artificial intelligence can support creativity, research, and responsible decision-making.",
    "A reliable system should be readable, maintainable, secure, and thoroughly tested.",
    "Progress is measured not only by speed, but also by accuracy and dependable habits.",
    "Thoughtful problem-solving turns complex challenges into manageable, testable components.",
    "The best results come from balancing efficiency, quality, and continuous improvement.",
    "When requirements change, flexible design makes software easier to adapt and extend.",
    "Clear communication helps teams coordinate ideas, resolve confusion, and deliver better outcomes.",
    "Successful learning combines deliberate practice, useful feedback, and steady reflection.",
    "A well-designed application should handle unexpected input without losing important information.",
    "Reliable software grows from careful planning, readable code, and meaningful testing."
  ]
};

const WORDS = [
  "planet", "focus", "window", "bright", "system", "garden",
  "typing", "puzzle", "future", "rocket", "school", "silver",
  "memory", "design", "orange", "signal", "engine", "rhythm",
  "coffee", "friend", "circle", "energy", "wonder", "journey",
  "creative", "keyboard", "challenge", "improve", "practice",
  "success", "journey", "balance", "discover", "progress"
];

const ACHIEVEMENTS = [
  { id: "first", name: "First Steps", icon: "🚀", description: "Complete your first typing task.", test: s => s.lifetimeTasks >= 1 },
  { id: "five", name: "Task Collector", icon: "⌨", description: "Complete five typing tasks.", test: s => s.lifetimeTasks >= 5 },
  { id: "accurate", name: "Accuracy Ace", icon: "🎯", description: "Finish a level with at least 98% accuracy.", test: s => s.accuracyAce },
  { id: "combo", name: "Combo Builder", icon: "⚡", description: "Complete five tasks in a row.", test: s => s.bestCombo >= 5 },
  { id: "climber", name: "Level Climber", icon: "🏔", description: "Complete level 5.", test: s => s.highestLevel >= 5 },
  { id: "centurion", name: "Point Master", icon: "🏆", description: "Earn 1,000 points in one session.", test: s => s.bestSessionScore >= 1000 },
  { id: "speed", name: "Speed Star", icon: "💨", description: "Reach 40 WPM in a session.", test: s => s.bestWpm >= 40 },
  { id: "dedicated", name: "Dedicated Typist", icon: "🌟", description: "Finish ten sessions.", test: s => s.sessions >= 10 }
];

function emptyData() {
  return {
    bestScore: 0,
    highestLevel: 0,
    sessions: 0,
    completedLevels: 0,
    xp: 0,
    lifetimeTasks: 0,
    bestCombo: 0,
    bestSessionScore: 0,
    bestWpm: 0,
    accuracyAce: false,
    levelRecords: {},
    achievements: []
  };
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return emptyData();
    const defaults = emptyData();
    return {
      ...defaults,
      ...saved,
      levelRecords: saved.levelRecords || {},
      achievements: Array.isArray(saved.achievements) ? saved.achievements : []
    };
  } catch {
    return emptyData();
  }
}

let data = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    showToast("Could not save records in this browser.");
  }
}

const state = {
  mode: "level",
  level: 1,
  task: 0,
  lives: 3,
  score: 0,
  levelScore: 0,
  combo: 0,
  bestCombo: 0,
  levelCorrectChars: 0,
  levelAttempts: 0,
  levelCorrectAttempts: 0,
  sessionCorrectChars: 0,
  sessionAttempts: 0,
  sessionCorrectAttempts: 0,
  sessionErrors: 0,
  sessionTasks: 0,
  timeLeft: 38,
  maxTime: 38,
  rushTime: 45,
  prompt: "",
  taskResolved: false,
  startedTyping: false,
  paused: false,
  running: false,
  transitioning: false,
  activeSeconds: 0,
  sessionWpm: 0,
  lastInput: "",
  taskAttempts: 0,
  taskCorrectAttempts: 0,
  taskErrors: 0,
  taskCorrectChars: 0,
  sessionStartLevel: 1,
  levelStartCorrect: 0,
  levelStartAttempts: 0,
  levelStartCorrectAttempts: 0,
  levelStartErrors: 0,
  levelStartTasks: 0,
  levelStartScore: 0,
  lastLevelScore: 0,
  timerId: null,
  transitionId: null,
  toastId: null,
  recordAtStart: false
};

const screens = [
  "dashboard", "gameScreen", "resultsScreen",
  "recordsScreen", "achievementsScreen"
];

function showScreen(id) {
  screens.forEach(screenId => $(screenId).classList.toggle("active", screenId === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastId);
  state.toastId = setTimeout(() => toast.classList.remove("show"), 2700);
}

function difficultyFor(level) {
  if (level <= 2) return "easy";
  if (level <= 4) return "medium";
  return "hard";
}

function difficultyLabel(level) {
  const d = difficultyFor(level);
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function taskTime(level) {
  return Math.max(14, 38 - (level - 1) * 2);
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function makePrompt() {
  if (state.mode === "rush") {
    return randomItem(WORDS);
  }
  if (state.mode === "practice") {
    return randomItem(BANK[difficultyFor(state.level)]);
  }
  return randomItem(BANK[difficultyFor(state.level)]);
}

function startGame(mode) {
  clearTimeout(state.transitionId);
  clearInterval(state.timerId);

  state.mode = mode;
  state.level = mode === "level" ? Math.max(1, data.highestLevel + 1) : 1;
  state.task = 0;
  state.lives = 3;
  state.score = 0;
  state.levelScore = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.levelCorrectChars = 0;
  state.levelAttempts = 0;
  state.levelCorrectAttempts = 0;
  state.sessionCorrectChars = 0;
  state.sessionAttempts = 0;
  state.sessionCorrectAttempts = 0;
  state.sessionErrors = 0;
  state.sessionTasks = 0;
  state.activeSeconds = 0;
  state.sessionWpm = 0;
  state.rushTime = 45;
  state.running = true;
  state.paused = false;
  state.transitioning = false;
  state.startedTyping = false;
  state.taskResolved = false;
  state.recordAtStart = false;

  saveLevelSnapshot();
  $("pauseOverlay").classList.add("hidden");
  $("pauseBtn").textContent = "Ⅱ Pause";
  $("gameSubheading").textContent =
    mode === "level" ? "Complete three tasks to advance." :
    mode === "practice" ? "Practice at your own pace. No countdown." :
    "Type as many words as possible before time runs out.";

  showScreen("gameScreen");
  loadTask();

  state.timerId = setInterval(onTick, 1000);
  updateGameStats();
  $("typingInput").focus();
}

function saveLevelSnapshot() {
  state.levelStartCorrect = state.sessionCorrectChars;
  state.levelStartAttempts = state.sessionAttempts;
  state.levelStartCorrectAttempts = state.sessionCorrectAttempts;
  state.levelStartErrors = state.sessionErrors;
  state.levelStartTasks = state.sessionTasks;
  state.levelStartScore = state.score;
}

function loadTask() {
  if (!state.running) return;

  state.transitioning = false;
  state.taskResolved = false;
  state.startedTyping = false;
  state.lastInput = "";
  state.taskAttempts = 0;
  state.taskCorrectAttempts = 0;
  state.taskErrors = 0;
  state.taskCorrectChars = 0;
  state.prompt = makePrompt();

  if (state.mode === "rush") {
    state.timeLeft = state.rushTime;
    state.maxTime = 45;
    $("taskCounter").textContent = "WORD RUSH";
    $("gameHeading").innerHTML = 'Word Rush <span class="difficulty-pill medium">TIMED</span>';
  } else {
    state.maxTime = state.mode === "practice" ? 0 : taskTime(state.level);
    state.timeLeft = state.maxTime;
    $("taskCounter").textContent = "TASK " + (state.task + 1) + " / 3";
    $("gameHeading").innerHTML =
      (state.mode === "practice" ? "Practice Set " : "Level ") + state.level +
      ' <span class="difficulty-pill ' + difficultyFor(state.level) + '">' +
      difficultyLabel(state.level).toUpperCase() + "</span>";
  }

  $("typingInput").disabled = false;
  $("typingInput").value = "";
  $("charCount").textContent = "0 characters";
  $("typingStatus").textContent = state.mode === "practice"
    ? "Practice mode: take your time."
    : "The timer starts with your first character.";
  $("typingStatus").className = "";
  $("timerText").textContent = state.mode === "practice" ? "∞" : state.timeLeft + "s";
  $("timeBar").style.width = "100%";
  $("timeBar").style.background = "";
  $("levelProgressText").textContent = state.mode === "rush"
    ? state.sessionTasks + " words completed"
    : state.task + " / 3 tasks";
  $("levelBar").style.width = state.mode === "rush" ? "0%" : (state.task / 3 * 100) + "%";
  $("pauseOverlay").classList.add("hidden");

  renderPrompt("");
  updateGameStats();
  if (!state.paused) $("typingInput").focus();
}

function renderPrompt(typed) {
  const container = $("promptText");
  container.replaceChildren();

  for (let i = 0; i < state.prompt.length; i++) {
    const span = document.createElement("span");
    span.textContent = state.prompt[i];

    if (i < typed.length) {
      span.className = typed[i] === state.prompt[i] ? "char-correct" : "char-wrong";
    } else if (i === typed.length) {
      span.className = "char-current";
    } else {
      span.className = "char-pending";
    }
    container.appendChild(span);
  }
}

function handleTyping() {
  if (!state.running || state.paused || state.taskResolved || state.transitioning) return;

  const input = $("typingInput");
  const typed = input.value;

  if (typed.length > state.prompt.length) {
    input.value = typed.slice(0, state.prompt.length);
  }

  const current = input.value;
  if (current.length > 0 && !state.startedTyping) {
    state.startedTyping = true;
    $("typingStatus").textContent = "Timer running — keep your rhythm!";
  }

  renderPrompt(current);
  $("charCount").textContent = current.length + " / " + state.prompt.length + " characters";

  let mismatch = 0;
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== state.prompt[i]) mismatch++;
  }

  $("typingStatus").className = mismatch ? "bad" : "";
  if (mismatch > 0) {
    $("typingStatus").textContent = mismatch + " mismatch(es) in your current text. Correct them.";
  } else if (current.length > 0) {
    $("typingStatus").textContent = "Looking good. Keep going!";
  }

  if (current === state.prompt) {
    completeTask();
  }
  updateGameStats();
}

/*
 * Count printable key presses, not backspaces.
 * This makes accuracy account for mistakes even if they are corrected later.
 */
function countKeyAttempt(event) {
  if (!state.running || state.paused || state.taskResolved || state.transitioning) return;
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  if (event.key.length !== 1) return;

  const input = $("typingInput");
  const position = input.selectionStart;
  const expected = state.prompt[position];

  state.taskAttempts++;
  state.sessionAttempts++;
  state.levelAttempts++;

  if (event.key === expected) {
    state.taskCorrectAttempts++;
    state.sessionCorrectAttempts++;
    state.levelCorrectAttempts++;
  } else {
    state.taskErrors++;
    state.sessionErrors++;
  }
}

function completeTask() {
  if (state.taskResolved || !state.running || state.paused) return;

  state.taskResolved = true;
  $("typingInput").disabled = true;

  const length = state.prompt.length;
  const mistakes = state.taskErrors;
  const timeBonus = state.mode === "practice" ? 0 :
    Math.max(0, Math.floor(state.timeLeft * 2));
  const precisionBonus = mistakes === 0 ? Math.ceil(length * 0.5) : 0;
  const comboBonus = state.combo * 2;
  const points = length + timeBonus + precisionBonus + comboBonus;

  state.score += points;
  state.levelScore += points;
  state.sessionCorrectChars += length;
  state.levelCorrectChars += length;
  state.sessionTasks++;
  data.lifetimeTasks++;
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  data.bestCombo = Math.max(data.bestCombo, state.bestCombo);

  if (state.mode === "rush") {
    state.rushTime = Math.min(45, state.timeLeft + 2);
    state.timeLeft = state.rushTime;
    $("typingStatus").className = "good";
    $("typingStatus").textContent = "+" + points + " points! Next word loading…";
    updateGameStats();
    state.transitioning = true;
    state.transitionId = setTimeout(() => {
      if (state.running && !state.paused) loadTask();
    }, 320);
    return;
  }

  state.task++;
  $("levelProgressText").textContent = state.task + " / 3 tasks";
  $("levelBar").style.width = (state.task / 3 * 100) + "%";
  $("typingStatus").className = "good";
  $("typingStatus").textContent = "Correct! +" + points + " points earned.";
  updateGameStats();

  state.transitioning = true;
  state.transitionId = setTimeout(() => {
    if (!state.running || state.paused) return;
    if (state.task >= 3) {
      finishLevel();
    } else {
      loadTask();
    }
  }, 400);
}

function onTick() {
  if (!state.running || state.paused) return;

  if (state.startedTyping) state.activeSeconds++;

  if (state.mode === "practice") {
    updateGameStats();
    return;
  }

  if (state.mode === "rush") {
    if (state.startedTyping) state.timeLeft--;
    if (state.timeLeft <= 0) {
      finishRush();
      return;
    }
  } else if (state.startedTyping) {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      loseLife();
      return;
    }
  }

  $("timerText").textContent = state.timeLeft + "s";
  $("timeBar").style.width = Math.max(0, state.timeLeft / Math.max(1, state.maxTime) * 100) + "%";
  $("timeBar").style.background = state.timeLeft <= 7
    ? "linear-gradient(90deg,#ff7088,#ff9d8e)"
    : state.timeLeft <= 14
      ? "linear-gradient(90deg,#ffd17b,#ff9e7b)"
      : "";
  updateGameStats();
}

function loseLife() {
  if (state.taskResolved || state.transitioning) return;

  state.taskResolved = true;
  state.transitioning = true;
  state.lives--;
  state.combo = 0;
  $("typingInput").disabled = true;
  $("typingStatus").className = "bad";
  $("typingStatus").textContent = "Time is up! Life lost. You will retry this same task.";
  updateGameStats();

  state.transitionId = setTimeout(() => {
    if (state.lives <= 0) {
      finishSession("You ran out of lives. Practice and try again!");
      return;
    }
    // Retry the same task. It does not count as completed.
    loadTask();
    $("typingStatus").textContent = "New attempt. Take a breath and try again.";
  }, 900);
}

function finishLevel() {
  if (!state.running) return;

  state.running = false;
  clearInterval(state.timerId);
  clearTimeout(state.transitionId);

  const completedLevel = state.level;
  const points = state.levelScore;
  const previousBest = Number(data.levelRecords[completedLevel] || 0);
  const newRecord = points > previousBest;

  if (newRecord) data.levelRecords[completedLevel] = points;

  data.highestLevel = Math.max(data.highestLevel, completedLevel);
  data.completedLevels++;
  data.xp += points;
  data.bestScore = Math.max(data.bestScore, state.score);
  data.bestSessionScore = Math.max(data.bestSessionScore, state.score);

  const levelAccuracy = state.levelAttempts === 0 ? 100 :
    100 * state.levelCorrectAttempts / state.levelAttempts;
  if (levelAccuracy >= 98) data.accuracyAce = true;

  state.lastLevelScore = points;
  checkAchievements();
  saveData();

  $("resultEyebrow").textContent = "LEVEL " + completedLevel + " REPORT";
  $("resultMedal").textContent = newRecord ? "★" : "✓";
  $("resultTitle").textContent = "Level " + completedLevel + " complete!";
  $("resultDescription").textContent =
    "Three tasks completed. Your next challenge is waiting.";
  $("resultScore").textContent = "+" + points;
  $("resultWpm").textContent = calculateWpm().toFixed(1);
  $("resultAccuracy").textContent = levelAccuracy.toFixed(1) + "%";
  $("resultCorrect").textContent = state.levelCorrectChars;
  $("resultErrors").textContent = state.sessionErrors - state.levelStartErrors;
  $("recordBanner").textContent = newRecord
    ? "★ NEW LEVEL RECORD! " + points + " points"
    : "LEVEL BEST: " + data.levelRecords[completedLevel] + " points";
  $("recordBanner").style.color = newRecord ? "var(--green)" : "var(--cyan)";
  $("xpText").textContent = data.xp + " XP";
  $("xpBar").style.width = (data.xp % 100) + "%";
  $("continueBtn").textContent = "Continue to level " + (completedLevel + 1) + " →";

  showScreen("resultsScreen");
  updateDashboard();
}

function continueGame() {
  if (state.mode === "rush") {
    startGame("rush");
    return;
  }

  if (state.mode === "practice") {
    state.level++;
  } else {
    state.level++;
  }

  state.task = 0;
  state.levelScore = 0;
  state.lives = 3;
  state.combo = 0;
  state.levelCorrectChars = 0;
  state.levelAttempts = 0;
  state.levelCorrectAttempts = 0;
  saveLevelSnapshot();
  state.running = true;
  state.paused = false;
  state.transitioning = false;

  $("pauseBtn").textContent = "Ⅱ Pause";
  showScreen("gameScreen");
  loadTask();
  clearInterval(state.timerId);
  state.timerId = setInterval(onTick, 1000);
  $("typingInput").focus();
}

function finishRush() {
  if (!state.running) return;

  state.running = false;
  clearInterval(state.timerId);
  clearTimeout(state.transitionId);

  data.bestScore = Math.max(data.bestScore, state.score);
  data.bestSessionScore = Math.max(data.bestSessionScore, state.score);
  data.bestWpm = Math.max(data.bestWpm, calculateWpm());
  data.xp += state.score;
  checkAchievements();
  saveData();

  $("resultEyebrow").textContent = "WORD RUSH REPORT";
  $("resultMedal").textContent = "⚡";
  $("resultTitle").textContent = "Time's up!";
  $("resultDescription").textContent = "Your word-rush round is complete.";
  $("resultScore").textContent = state.score + " points";
  $("resultWpm").textContent = calculateWpm().toFixed(1);
  $("resultAccuracy").textContent = calculateAccuracy().toFixed(1) + "%";
  $("resultCorrect").textContent = state.sessionCorrectChars;
  $("resultErrors").textContent = state.sessionErrors;
  $("recordBanner").textContent = "Words completed: " + state.sessionTasks;
  $("xpText").textContent = data.xp + " XP";
  $("xpBar").style.width = (data.xp % 100) + "%";
  $("continueBtn").textContent = "Play Word Rush again →";

  showScreen("resultsScreen");
  updateDashboard();
}

function finishSession(message) {
  if (!state.running) return;

  state.running = false;
  state.paused = false;
  clearInterval(state.timerId);
  clearTimeout(state.transitionId);

  data.sessions++;
  data.bestScore = Math.max(data.bestScore, state.score);
  data.bestSessionScore = Math.max(data.bestSessionScore, state.score);
  data.bestWpm = Math.max(data.bestWpm, calculateWpm());
  checkAchievements();
  saveData();

  $("resultEyebrow").textContent = "SESSION REPORT";
  $("resultMedal").textContent = "✦";
  $("resultTitle").textContent = "Training complete";
  $("resultDescription").textContent = message;
  $("resultScore").textContent = state.score + " points";
  $("resultWpm").textContent = calculateWpm().toFixed(1);
  $("resultAccuracy").textContent = calculateAccuracy().toFixed(1) + "%";
  $("resultCorrect").textContent = state.sessionCorrectChars;
  $("resultErrors").textContent = state.sessionErrors;
  $("recordBanner").textContent = "Personal best: " + data.bestScore + " points";
  $("xpText").textContent = data.xp + " XP";
  $("xpBar").style.width = (data.xp % 100) + "%";
  $("continueBtn").textContent = "Try again →";
  showScreen("resultsScreen");
  updateDashboard();
}

function calculateWpm() {
  if (state.activeSeconds <= 0) return 0;
  // Standard gross WPM: five characters per word.
  return (state.sessionCorrectChars / 5) / (state.activeSeconds / 60);
}

function calculateAccuracy() {
  if (state.sessionAttempts <= 0) return 100;
  return Math.max(0, Math.min(100,
    100 * state.sessionCorrectAttempts / state.sessionAttempts));
}

function updateGameStats() {
  $("scoreStat").textContent = state.score;
  $("wpmStat").textContent = calculateWpm().toFixed(1);
  $("accuracyStat").textContent = calculateAccuracy().toFixed(1) + "%";
  $("comboStat").textContent = state.combo + "×";
  $("livesStat").textContent = "♥ ".repeat(state.lives).trim() || "—";
  $("sessionScore").textContent = state.score;
}

function togglePause(forcePause) {
  if (!state.running) return;
  state.paused = typeof forcePause === "boolean" ? forcePause : !state.paused;

  $("pauseOverlay").classList.toggle("hidden", !state.paused);
  $("pauseBtn").textContent = state.paused ? "▶ Resume" : "Ⅱ Pause";
  $("typingInput").disabled = state.paused || state.taskResolved;
  if (!state.paused) $("typingInput").focus();
}

function restartGame() {
  if (confirm("Restart this session? Your current session score will be lost.")) {
    startGame(state.mode);
  }
}

function checkAchievements() {
  const facts = {
    lifetimeTasks: data.lifetimeTasks,
    bestCombo: data.bestCombo,
    highestLevel: data.highestLevel,
    bestSessionScore: data.bestSessionScore,
    bestWpm: data.bestWpm,
    accuracyAce: data.accuracyAce,
    sessions: data.sessions
  };

  ACHIEVEMENTS.forEach(item => {
    if (item.test(facts) && !data.achievements.includes(item.id)) {
      data.achievements.push(item.id);
      showToast("Achievement unlocked: " + item.name + " " + item.icon);
    }
  });
}

function renderAchievements() {
  const unlocked = new Set(data.achievements);
  const makeItem = item => {
    const isUnlocked = unlocked.has(item.id);
    return `
      <div class="achievement-item">
        <div class="achievement-icon ${isUnlocked ? "" : "locked"}">${item.icon}</div>
        <div class="achievement-info">
          <b>${item.name}</b>
          <small>${item.description}</small>
        </div>
        <span class="achievement-status">${isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
      </div>`;
  };

  $("achievementPreview").innerHTML = ACHIEVEMENTS
    .filter(a => unlocked.has(a.id)).slice(0, 3).map(makeItem).join("");

  if (!unlocked.size) {
    $("achievementPreview").innerHTML =
      '<div class="achievement-item"><div class="achievement-icon">🔒</div>' +
      '<div class="achievement-info"><b>Your first milestone awaits</b>' +
      '<small>Complete a typing task to begin collecting achievements.</small></div></div>';
  }
  $("allAchievements").innerHTML = ACHIEVEMENTS.map(makeItem).join("");
  $("dashAchievements").textContent = data.achievements.length;
}

function updateDashboard() {
  $("dashLevel").textContent = data.highestLevel;
  $("dashBest").textContent = data.bestScore;
  $("dashSessions").textContent = data.sessions;
  renderAchievements();
}

function renderRecords() {
  $("recordBest").textContent = data.bestScore;
  $("recordLevel").textContent = data.highestLevel;
  $("recordSessions").textContent = data.sessions;
  $("recordXP").textContent = data.xp;

  const maxLevel = Math.max(10, data.highestLevel + 2,
    ...Object.keys(data.levelRecords).map(Number).filter(Number.isFinite));
  const rows = [];

  for (let level = 1; level <= maxLevel; level++) {
    const record = Number(data.levelRecords[level] || 0);
    const difficulty = difficultyLabel(level);
    rows.push(`<tr>
      <td>Level ${level}</td>
      <td>${difficulty}</td>
      <td>${record.toLocaleString()}</td>
      <td class="${record > 0 ? "status-complete" : "status-new"}">
        ${record > 0 ? "✓ Record saved" : "Not completed"}
      </td>
    </tr>`);
  }
  $("recordsTable").innerHTML = rows.join("");
}

function resetRecords() {
  if (!confirm("Delete all saved scores, achievements, XP, and progress from this browser?")) return;
  data = emptyData();
  saveData();
  updateDashboard();
  renderRecords();
  showToast("Saved records reset.");
}

function setTheme() {
  document.body.classList.toggle("light-theme");
  localStorage.setItem("typingMasterTheme",
    document.body.classList.contains("light-theme") ? "light" : "dark");
}

function restoreTheme() {
  if (localStorage.getItem("typingMasterTheme") === "light") {
    document.body.classList.add("light-theme");
  }
}

function selectedMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || "level";
}

/* ------------------- Event handlers ------------------- */

$("startBtn").addEventListener("click", () => startGame("level"));
$("practiceBtn").addEventListener("click", () => startGame("practice"));
$("launchBtn").addEventListener("click", () => startGame(selectedMode()));

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.querySelectorAll(".mode-option").forEach(label =>
      label.classList.toggle("selected", label.contains(radio) && radio.checked));
  });
});

$("typingInput").addEventListener("keydown", countKeyAttempt);
$("typingInput").addEventListener("input", handleTyping);
$("pauseBtn").addEventListener("click", () => togglePause());
$("resumeBtn").addEventListener("click", () => togglePause(false));
$("restartBtn").addEventListener("click", restartGame);

$("gameHomeBtn").addEventListener("click", () => {
  if (state.running && !confirm("Leave this session? Its current score will not be recorded as a completed session.")) return;
  state.running = false;
  state.paused = false;
  clearInterval(state.timerId);
  clearTimeout(state.transitionId);
  updateDashboard();
  showScreen("dashboard");
});

$("continueBtn").addEventListener("click", () => {
  if (state.mode === "rush") startGame("rush");
  else if (state.mode === "level" || state.mode === "practice") continueGame();
  else startGame("level");
});

$("resultsHomeBtn").addEventListener("click", () => {
  updateDashboard();
  showScreen("dashboard");
});

$("recordsBtn").addEventListener("click", () => {
  renderRecords();
  showScreen("recordsScreen");
});
$("recordsHomeBtn").addEventListener("click", () => {
  updateDashboard();
  showScreen("dashboard");
});
$("achievementsBtn").addEventListener("click", () => {
  renderAchievements();
  showScreen("achievementsScreen");
});
$("achievementsHomeBtn").addEventListener("click", () => {
  updateDashboard();
  showScreen("dashboard");
});
$("resetRecordsBtn").addEventListener("click", resetRecords);
$("themeBtn").addEventListener("click", setTheme);
$("brandHome").addEventListener("click", event => {
  event.preventDefault();
  if (state.running) {
    if (!confirm("Return to dashboard and leave the current session?")) return;
    state.running = false;
    clearInterval(state.timerId);
    clearTimeout(state.transitionId);
  }
  updateDashboard();
  showScreen("dashboard");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.running && !state.paused) {
    togglePause(true);
    showToast("Game paused while the page was hidden.");
  }
});

restoreTheme();
updateDashboard();
renderRecords();
