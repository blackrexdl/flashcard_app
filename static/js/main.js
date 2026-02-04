function toggleTheme() {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
}

function submitQuiz() {
    const quizCards = document.querySelectorAll(".quiz-card");
    let score = 0;
    let retryQuestions = [];

    quizCards.forEach(card => {
        const correctAnswer = card.dataset.answer;
        const options = card.querySelectorAll("input[type='radio']");
        let selectedValue = null;

        options.forEach(opt => {
            if (opt.checked) {
                selectedValue = opt.value;
            }
        });

        options.forEach(opt => {
            const label = opt.parentElement;
            label.classList.remove("correct", "wrong");
            if (opt.value === correctAnswer) {
                label.classList.add("correct");
            }
            if (opt.checked && opt.value !== correctAnswer) {
                label.classList.add("wrong");
            }
        });

        card.querySelector(".explanation").classList.remove("hidden");
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
    const resultBox = document.getElementById("result");

    let message = "Keep practicing 👍";
    if (score === total) message = "Perfect score 💯";
    else if (score < total / 2) message = "Needs improvement 💪";

    resultBox.innerHTML = `
        <h3>Quiz Result</h3>
        <p><b>Score:</b> ${score} / ${total}</p>
        <p>${message}</p>
    `;
    resultBox.classList.remove("hidden");

    // Save score and retry questions count locally
    localStorage.setItem("lastQuizScore", score);
    localStorage.setItem("lastQuizTotal", total);
    localStorage.setItem("retryQuestionsCount", retryQuestions.length);
    localStorage.setItem("retryQuestions", JSON.stringify(retryQuestions));

    // ---- Best score tracking per category ----
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
    // ------------------------------------------

    // Display last score
    displayLastScore();

    // Show or hide retry button based on incorrect questions
    const retryBtn = document.getElementById("retry-btn");
    if (retryQuestions.length > 0) {
        retryBtn.style.display = "inline-block";
    } else {
        retryBtn.style.display = "none";
    }
}

function displayLastScore() {
    const lastScoreEl = document.getElementById("last-score");
    const lastScore = localStorage.getItem("lastQuizScore");
    const lastTotal = localStorage.getItem("lastQuizTotal");
    if (lastScore !== null && lastTotal !== null && lastScoreEl) {
        lastScoreEl.innerText = `Previous score: ${lastScore} / ${lastTotal}`;
    }
}

// Initialize previous score display on page load
document.addEventListener("DOMContentLoaded", () => {
    displayLastScore();
});

// Start 60-second countdown timer
document.addEventListener("DOMContentLoaded", () => {
    const timerEl = document.getElementById("time");
    if (!timerEl) return;

    let quizTime = 60; // seconds
    const timerInterval = setInterval(() => {
        if (quizTime <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        } else {
            quizTime--;
            timerEl.innerText = quizTime;
        }
    }, 1000);
});

const retryBtn = document.getElementById("retry-btn");

if (retryBtn) {
retryBtn.addEventListener("click", () => {
    const allCards = document.querySelectorAll(".quiz-card");
    const retryQuestionsIds = JSON.parse(localStorage.getItem("retryQuestions")) || [];

    if (retryQuestionsIds.length === 0) {
        alert("No incorrect questions to retry!");
        return;
    }

    allCards.forEach(card => {
        // Reset all cards first
        card.classList.remove("disabled");
        card.querySelectorAll(".option").forEach(label => {
            label.classList.remove("correct", "wrong");
            const input = label.querySelector("input");
            if (input) input.checked = false;
        });
        card.querySelector(".explanation").classList.add("hidden");

        // Show only retry questions, hide others
        const cardId = card.dataset.questionId || card.id || "";
        if (retryQuestionsIds.includes(cardId)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });

    document.getElementById("result").classList.add("hidden");
    retryBtn.style.display = "none"; // Hide button until next submit
});
}

// =======================
//    Results Dashboard Logic (FINAL FIX)
// =======================
document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.getElementById("dashboard-cards");

    const chartArea = document.createElement("div");
    chartArea.className = "dashboard-charts";

    chartArea.innerHTML = `
      <canvas id="barChart" height="120"></canvas>
      <canvas id="donutChart" height="140"></canvas>
    `;

    dashboard.parentElement.insertBefore(chartArea, dashboard);

    const noData = document.getElementById("no-data");

    // Run only on dashboard page
    if (!dashboard) return;

    let categories = [];

    // Read bestScore_* keys (actual source of truth)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("bestScore_")) {
            categories.push(key.replace("bestScore_", ""));
        }
    });

    if (categories.length === 0) {
        noData.classList.remove("hidden");
        return;
    }

    noData.classList.add("hidden");

    categories.forEach(category => {
        const best = parseInt(localStorage.getItem(`bestScore_${category}`)) || 0;

        // Default total questions = 5 (safe assumption)
        const total = 5;
        const percent = Math.round((best / total) * 100);

        const card = document.createElement("div");
        card.className = "dashboard-card";

        card.innerHTML = `
            <h3 class="dashboard-category">${category}</h3>

            <div class="dashboard-progress">
                <div class="dashboard-progress-bar">
                    <div class="dashboard-progress-fill" style="width:${percent}%"></div>
                </div>
                <span class="dashboard-percent">${percent}%</span>
            </div>

            <div class="dashboard-stats">
                <p><b>Best Score:</b> ${best} / ${total}</p>
            </div>
        `;

        dashboard.appendChild(card);
    });

    const chartData = {};
    categories.forEach(cat => {
      chartData[cat] = parseInt(localStorage.getItem(`bestScore_${cat}`)) || 0;
    });

    renderBarChart(chartData);
    renderDonutChart(chartData);
});

/* =======================
   Dashboard Charts
   ======================= */

function renderBarChart(data) {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const labels = Object.keys(data);
  const values = Object.values(data);

  const max = Math.max(...values, 5);
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const barWidth = width / (labels.length * 2);

  values.forEach((val, i) => {
    const x = (i * 2 + 1) * barWidth;
    const barHeight = (val / max) * (height - 30);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

    ctx.fillStyle = "#888";
    ctx.fillText(labels[i], x, height - 5);
  });
}

function renderDonutChart(data) {
  const canvas = document.getElementById("donutChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const values = Object.values(data);
  const total = values.reduce((a, b) => a + b, 0) || 1;

  let start = 0;
  const centerX = canvas.width = canvas.offsetWidth / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  values.forEach((val, i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${i * 60}, 70%, 50%)`;
    ctx.lineWidth = 18;
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.stroke();
    start += slice;
  });
}