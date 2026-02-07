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
        ["lastQuizScore", "lastQuizTotal", "retryQuestions", "retryQuestionsCount"].includes(key)
      ) {
        localStorage.removeItem(key);
      }
    });

    location.reload();
  });

  const noData = document.getElementById("no-data");
  const filterSelect = document.getElementById("category-filter");
  const categoryBox = document.getElementById("category-performance");

  const categories = Object.keys(localStorage)
    .filter(k => k.startsWith("bestScore_"))
    .map(k => k.replace("bestScore_", ""));

  if (categories.length === 0) {
    noData?.classList.remove("hidden");
    return;
  }

  noData?.classList.add("hidden");

  let filtered = [...categories];

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.innerText = cat;
    filterSelect?.appendChild(opt);
  });

  filterSelect?.addEventListener("change", () => {
    filtered = filterSelect.value === "all" ? [...categories] : [filterSelect.value];
    renderDashboard();
  });

  function renderDashboard() {
    dashboard.innerHTML = "";
    categoryBox && (categoryBox.innerHTML = "");

    let totalPercent = 0;
    let highestBestScore = 0;

    const scores = filtered.map(cat => {
      const best = parseInt(localStorage.getItem(`bestScore_${cat}`)) || 0;
      const total = 5;
      return { cat, percent: Math.round((best / total) * 100) };
    });

    const topCategory = scores.reduce((a, b) => (b.percent > a.percent ? b : a), scores[0]);
    const weakCategory = scores.reduce((a, b) => (b.percent < a.percent ? b : a), scores[0]);

    filtered.forEach(cat => {
      const best = parseInt(localStorage.getItem(`bestScore_${cat}`)) || 0;
      const total = 5;
      const percent = Math.round((best / total) * 100);

      totalPercent += percent;
      highestBestScore = Math.max(highestBestScore, best);
    });

    /* =========================
       PROFESSIONAL STAT CARDS
       ========================= */

    const bestNameEl = document.getElementById("best-category-name");
    const bestScoreEl = document.getElementById("best-category-score");
    const weakNameEl = document.getElementById("weak-category-name");
    const weakScoreEl = document.getElementById("weak-category-score");

    const accuracyTextEl = document.getElementById("overall-accuracy-text");
    const completedTextEl = document.getElementById("categories-completed-text");

    if (topCategory) {
      bestNameEl.innerText = topCategory.cat;
      animateCount(bestScoreEl, topCategory.percent);
    }

    if (weakCategory) {
      weakNameEl.innerText = weakCategory.cat;
      animateCount(weakScoreEl, weakCategory.percent);
    }

    completedTextEl.innerText = filtered.length;

    const avgAccuracy = Math.round(totalPercent / filtered.length);
    accuracyTextEl.innerText = "0%";
    animateCount(accuracyTextEl, avgAccuracy);

    /* Emphasize best card subtly */
    const bestCard = document.querySelector(".dashboard-stat-card.best-card");
    if (bestCard) {
      bestCard.style.transform = "scale(0.96)";
      bestCard.style.transition = "transform 400ms ease";

      requestAnimationFrame(() => {
        bestCard.style.transform = "scale(1)";
      });
    }
  }

  renderDashboard();
});