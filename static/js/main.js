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

    const resetBtn = document.getElementById("reset-progress-btn");

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (!confirm("Are you sure you want to reset all progress?")) return;

            Object.keys(localStorage).forEach(key => {
                if (
                    key.startsWith("bestScore_") ||
                    key === "lastQuizScore" ||
                    key === "lastQuizTotal" ||
                    key === "retryQuestions" ||
                    key === "retryQuestionsCount"
                ) {
                    localStorage.removeItem(key);
                }
            });

            location.reload();
        });
    }

    const summaryBox = document.createElement("div");
    summaryBox.className = "dashboard-summary";

    summaryBox.innerHTML = `
      <div class="summary-card">
        <h2 id="overall-score">0%</h2>
        <p>Overall Performance</p>
      </div>
    `;
    dashboard.parentElement.insertBefore(summaryBox, dashboard);

    const chartArea = document.querySelector(".dashboard-charts");

    const noData = document.getElementById("no-data");

    // Run only on dashboard page
    if (!dashboard) return;

    let categories = [];
    let filteredCategories = [];

    // Read bestScore_* keys (actual source of truth)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("bestScore_")) {
            categories.push(key.replace("bestScore_", ""));
        }
    });

    filteredCategories = [...categories];

    const filterSelect = document.getElementById("category-filter");
    if (filterSelect) {
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.innerText = cat;
            filterSelect.appendChild(opt);
        });

        filterSelect.addEventListener("change", () => {
            const val = filterSelect.value;
            filteredCategories = val === "all" ? [...categories] : [val];
            renderDashboard();
        });
    }

    if (categories.length === 0) {
        noData.classList.remove("hidden");
        return;
    }

    noData.classList.add("hidden");

    function renderDashboard() {
        dashboard.innerHTML = "";
        let totalPercent = 0;

        filteredCategories.forEach(category => {
            const best = parseInt(localStorage.getItem(`bestScore_${category}`)) || 0;
            const total = 5;
            const percent = Math.round((best / total) * 100);

            totalPercent += percent;

            const card = document.createElement("div");
            card.className = "dashboard-card";

            card.innerHTML = `
                <h3 class="dashboard-category">${category}</h3>

                <div class="dashboard-text-stats">
                    <p><b>Best Score:</b> ${best} / ${total}</p>
                    <p><b>Accuracy:</b> ${percent}%</p>
                </div>
            `;

            dashboard.appendChild(card);
        });

        const overall = Math.round(totalPercent / filteredCategories.length);
        const overallEl = document.getElementById("overall-score");
        if (overallEl && !isNaN(overall)) {
            overallEl.innerText = overall + "%";
        }

        // ===========================
        //   Populate new text stats
        // ===========================
        const categoriesEl = document.getElementById("stat-categories");
        const bestScoreEl = document.getElementById("stat-best-score");
        const accuracyEl = document.getElementById("stat-accuracy");

        let totalBest = 0;
        filteredCategories.forEach(cat => {
          totalBest += parseInt(localStorage.getItem(`bestScore_${cat}`)) || 0;
        });

        if (categoriesEl) categoriesEl.innerText = filteredCategories.length;
        if (bestScoreEl) bestScoreEl.innerText = totalBest;

        const accuracy = Math.min(
          100,
          Math.round(totalBest / (filteredCategories.length * 5) * 100)
        );

        if (accuracyEl) accuracyEl.innerText = accuracy + "%";
    }

    renderDashboard();
});
