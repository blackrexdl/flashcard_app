/* =========================
   THEME
   ========================= */
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
}

/* =========================
   QUIZ LOGIC
   ========================= */
function submitQuiz() {
  console.log("submitQuiz fired");
  const quizCards = document.querySelectorAll(".quiz-card");
  let score = 0;
  const retryQuestions = [];

  quizCards.forEach(card => {
    const correctAnswer = card.dataset.answer;
    const options = card.querySelectorAll("input[type='radio']");
    let selectedValue = null;

    options.forEach(opt => {
      if (opt.checked) selectedValue = opt.value;
    });

    options.forEach(opt => {
      const label = opt.parentElement;
      label.classList.remove("correct", "wrong");

      if (opt.value === correctAnswer) label.classList.add("correct");
      if (opt.checked && opt.value !== correctAnswer) label.classList.add("wrong");
    });

    card.querySelector(".explanation")?.classList.remove("hidden");
    card.classList.add("disabled");

    if (selectedValue === correctAnswer) {
      score++;
    } else {
      retryQuestions.push(card.dataset.questionId || card.id || "");
    }
  });

  const total = quizCards.length;
  const category =
    document.body.dataset.category ||
    document.getElementById("quiz-category")?.innerText ||
    "General";

  renderQuizResult(score, total, category, retryQuestions);
  toggleRetryButton(retryQuestions.length);
}

/* =========================
   QUIZ HELPERS
   ========================= */
function renderQuizResult(score, total, category, retryQuestions) {
  let message = "Keep practicing 👍";
  if (score === total) message = "Perfect score 💯";
  else if (score < total / 2) message = "Needs improvement 💪";

  const bestKey = `bestScore_${category}`;
  const prevBest = parseInt(localStorage.getItem(bestKey) || "0", 10);
  const bestScore = Math.max(prevBest, score);
  localStorage.setItem(bestKey, bestScore);

  console.log("Saving quiz attempt:", { category, score, total });

  let attempts = [];
  try {
    attempts = JSON.parse(localStorage.getItem("quizAttempts")) || [];
  } catch (e) {
    attempts = [];
  }

  attempts.push({
    category,
    score,
    total,
    percent: Math.round((score / total) * 100),
    timestamp: Date.now()
  });

  localStorage.setItem("quizAttempts", JSON.stringify(attempts));

  const resultBox = document.getElementById("result");
  if (!resultBox) return;

  console.log("quizAttempts now:", localStorage.getItem("quizAttempts"));

  resultBox.innerHTML = `
    <h3>Quiz Result</h3>
    <p><b>Score:</b> ${score} / ${total}</p>
    <p>${message}</p>
  `;
  resultBox.classList.remove("hidden");
}

function toggleRetryButton(count) {
  const retryBtn = document.getElementById("retry-btn");
  if (!retryBtn) return;
  retryBtn.style.display = count > 0 ? "inline-block" : "none";
}

/* =========================
   COUNT ANIMATION
   ========================= */
function animateCount(el, target, duration = 900) {
  if (!el) return;
  let start = 0;
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function update(now) {
    const rawProgress = Math.min((now - startTime) / duration, 1);
    const progress = easeOutCubic(rawProgress);
    const value = Math.round(start + progress * (target - start));
    el.innerText = value + "%";
    if (rawProgress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* =========================
   RETRY INCORRECT QUESTIONS
   ========================= */
const retryBtnEl = document.getElementById("retry-btn");
if (retryBtnEl) {
  retryBtnEl.addEventListener("click", () => {
    const retryIds = JSON.parse(localStorage.getItem("retryQuestions")) || [];
    if (retryIds.length === 0) return alert("No incorrect questions to retry!");

    document.querySelectorAll(".quiz-card").forEach(card => {
      card.classList.remove("disabled");
      card.querySelectorAll(".option").forEach(label => {
        label.classList.remove("correct", "wrong");
        const input = label.querySelector("input");
        if (input) input.checked = false;
      });
      const explanation = card.querySelector(".explanation");
      if (explanation) explanation.classList.add("hidden");

      const id = card.dataset.questionId || card.id || "";
      card.style.display = retryIds.includes(id) ? "block" : "none";
    });

    const result = document.getElementById("result");
    if (result) result.classList.add("hidden");
    retryBtnEl.style.display = "none";
  });
}

/* =========================
   DASHBOARD LOGIC
   ========================= */
function renderDashboard() {
  const container = document.getElementById("dashboard-cards");
  if (!container) return;

  const attempts = JSON.parse(localStorage.getItem("quizAttempts") || "[]");
  console.log("Dashboard attempts:", attempts);

  const noData = document.getElementById("no-data");

  if (attempts.length === 0) {
    if (noData) noData.classList.remove("hidden");
    return;
  }

  if (noData) noData.classList.add("hidden");

  const byCategory = {};
  attempts.forEach(a => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a.percent);
  });

  const categories = Object.keys(byCategory);

  let bestCategory = null;
  let weakCategory = null;
  let totalPercent = 0;

  categories.forEach(cat => {
    const avg =
      byCategory[cat].reduce((a, b) => a + b, 0) /
      byCategory[cat].length;

    totalPercent += avg;

    if (!bestCategory || avg > bestCategory.avg) {
      bestCategory = { cat, avg };
    }

    if (!weakCategory || avg < weakCategory.avg) {
      weakCategory = { cat, avg };
    }
  });

  const avgAccuracy = Math.round(totalPercent / categories.length);

  const statCategories = document.getElementById("stat-categories");
  const statBest = document.getElementById("stat-best-score");
  const statAccuracy = document.getElementById("stat-accuracy");

  if (statCategories) statCategories.innerText = attempts.length;
  if (statBest) statBest.innerText = Math.round(bestCategory.avg) + "%";
  if (statAccuracy) statAccuracy.innerText = avgAccuracy + "%";

  const bestName = document.getElementById("best-category-name");
  const bestScore = document.getElementById("best-category-score");
  const weakName = document.getElementById("weak-category-name");
  const weakScore = document.getElementById("weak-category-score");
  const completedText = document.getElementById("categories-completed-text");
  const overallText = document.getElementById("overall-accuracy-text");

  if (bestName) bestName.innerText = bestCategory.cat;
  if (bestScore) animateCount(bestScore, Math.round(bestCategory.avg));

  if (weakName) weakName.innerText = weakCategory.cat;
  if (weakScore) animateCount(weakScore, Math.round(weakCategory.avg));

  if (completedText) completedText.innerText = attempts.length;
  if (overallText) animateCount(overallText, avgAccuracy);
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();

  const attempts = JSON.parse(localStorage.getItem("quizAttempts") || "[]");
  console.log("Dashboard attempts:", attempts);

  const resetBtn = document.getElementById("reset-progress-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to reset all progress?")) return;

      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith("bestScore_") ||
          ["lastQuizScore", "lastQuizTotal", "retryQuestions", "retryQuestionsCount", "quizAttempts"].includes(key)
        ) {
          localStorage.removeItem(key);
        }
      });

      location.reload();
    });
  }
});