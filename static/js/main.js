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
    let totalBest = 0;

    filtered.forEach(cat => {
      const best = parseInt(localStorage.getItem(`bestScore_${cat}`)) || 0;
      const total = 5;
      const percent = Math.round((best / total) * 100);

      totalPercent += percent;
      totalBest += best;

      const card = document.createElement("div");
      card.className = "dashboard-card";
      card.innerHTML = `
        <h3 class="dashboard-category">${cat}</h3>
        <div class="dashboard-text-stats">
          <p><b>Best Score:</b> ${best} / ${total}</p>
          <p><b>Accuracy:</b> ${percent}%</p>
        </div>
      `;
      dashboard.appendChild(card);

      if (categoryBox) {
        const row = document.createElement("div");
        row.className = "category-performance-row";
        row.innerHTML = `
          <span class="category-name">${cat}</span>
          <span class="category-score">${best}/${total}</span>
          <span class="category-percent">${percent}%</span>
        `;
        categoryBox.appendChild(row);
      }
    });

    const overallScoreEl = document.getElementById("overall-score");
    const statCategoriesEl = document.getElementById("stat-categories");
    const statBestScoreEl = document.getElementById("stat-best-score");
    const statAccuracyEl = document.getElementById("stat-accuracy");

    if (overallScoreEl) {
      overallScoreEl.innerText =
        Math.round(totalPercent / filtered.length) + "%";
    }

    if (statCategoriesEl) statCategoriesEl.innerText = filtered.length;
    if (statBestScoreEl) statBestScoreEl.innerText = totalBest;
    if (statAccuracyEl) {
      statAccuracyEl.innerText =
        Math.min(100, Math.round((totalBest / (filtered.length * 5)) * 100)) + "%";
    }
  }

  renderDashboard();
});