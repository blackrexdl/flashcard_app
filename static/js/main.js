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
  saveQuizProgress(score, total, category, retryQuestions);
  displayLastScore();
  toggleRetryButton(retryQuestions.length);
}

/* =========================
   QUIZ HELPERS
   ========================= */
function renderQuizResult(score, total, category, retryQuestions) {
  const resultBox = document.getElementById("result");
  if (!resultBox) return;

  let message = "Keep practicing 👍";
  if (score === total) message = "Perfect score 💯";
  else if (score < total / 2) message = "Needs improvement 💪";

  resultBox.innerHTML = `
    <h3>Quiz Result</h3>
    <p><b>Score:</b> ${score} / ${total}</p>
    <p>${message}</p>
  `;
  resultBox.classList.remove("hidden");

  const bestKey = `bestScore_${category}`;
  const prevBest = parseInt(localStorage.getItem(bestKey) || "0", 10);
  const bestScore = Math.max(prevBest, score);
  localStorage.setItem(bestKey, bestScore);

  const attempts = JSON.parse(localStorage.getItem("quizAttempts") || "[]");

  attempts.push({
    category,
    score,
    total,
    percent: Math.round((score / total) * 100),
    timestamp: Date.now()
  });

  localStorage.setItem("quizAttempts", JSON.stringify(attempts));

  const percent = Math.round((bestScore / total) * 100);
  const box = document.getElementById("best-score-box");

  if (box) {
    document.getElementById("best-category").innerText = category;
    document.getElementById("best-percent").innerText = percent;
    document.getElementById("progress-fill").style.width = percent + "%";
    box.classList.remove("hidden");
  }
}

function saveQuizProgress(score, total, category, retryQuestions) {
  localStorage.setItem("lastQuizScore", score);
  localStorage.setItem("lastQuizTotal", total);
  localStorage.setItem("retryQuestions", JSON.stringify(retryQuestions));
  localStorage.setItem("retryQuestionsCount", retryQuestions.length);
}

function toggleRetryButton(count) {
  const retryBtn = document.getElementById("retry-btn");
  if (!retryBtn) return;
  retryBtn.style.display = count > 0 ? "inline-block" : "none";
}

/* =========================
   LAST SCORE
   ========================= */
function displayLastScore() {
  const el = document.getElementById("last-score");
  const score = localStorage.getItem("lastQuizScore");
  const total = localStorage.getItem("lastQuizTotal");

  if (el && score !== null && total !== null) {
    el.innerText = `Previous score: ${score} / ${total}`;
  }
}

document.addEventListener("DOMContentLoaded", displayLastScore);

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
document.getElementById("retry-btn")?.addEventListener("click", () => {
  const retryIds = JSON.parse(localStorage.getItem("retryQuestions")) || [];
  if (retryIds.length === 0) return alert("No incorrect questions to retry!");

  document.querySelectorAll(".quiz-card").forEach(card => {
    card.classList.remove("disabled");
    card.querySelectorAll(".option").forEach(label => {
      label.classList.remove("correct", "wrong");
      label.querySelector("input")?.checked = false;
    });
    card.querySelector(".explanation")?.classList.add("hidden");

    const id = card.dataset.questionId || card.id || "";
    card.style.display = retryIds.includes(id) ? "block" : "none";
  });

  document.getElementById("result")?.classList.add("hidden");
  document.getElementById("retry-btn").style.display = "none";
});

/* =========================
   DASHBOARD LOGIC
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("dashboard-cards");
  if (!dashboard) return;

  const resetBtn = document.getElementById("reset-progress-btn");
  resetBtn?.addEventListener("click", () => {
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

  const noData = document.getElementById("no-data");

  function renderDashboard() {
    const attempts = JSON.parse(localStorage.getItem("quizAttempts") || "[]");

    if (attempts.length === 0) {
      noData?.classList.remove("hidden");
      return;
    }

    noData?.classList.add("hidden");

    const byCategory = {};
    attempts.forEach(a => {
      if (!byCategory[a.category]) {
        byCategory[a.category] = [];
      }
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

    /* HERO */
    document.getElementById("stat-categories").innerText = categories.length;
    document.getElementById("stat-best-score").innerText = Math.round(bestCategory.avg);
    document.getElementById("stat-accuracy").innerText = avgAccuracy + "%";

    /* CARDS */
    document.getElementById("best-category-name").innerText = bestCategory.cat;
    animateCount(
      document.getElementById("best-category-score"),
      Math.round(bestCategory.avg)
    );

    document.getElementById("weak-category-name").innerText = weakCategory.cat;
    animateCount(
      document.getElementById("weak-category-score"),
      Math.round(weakCategory.avg)
    );

    document.getElementById("categories-completed-text").innerText =
      categories.length;

    animateCount(
      document.getElementById("overall-accuracy-text"),
      avgAccuracy
    );
  }

  renderDashboard();
});