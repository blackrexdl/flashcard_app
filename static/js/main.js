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
let quizTime = 60; // seconds
const timerEl = document.getElementById("time");
const timerInterval = setInterval(() => {
    if (quizTime <= 0) {
        clearInterval(timerInterval);
        submitQuiz();
    } else {
        quizTime--;
        if (timerEl) timerEl.innerText = quizTime;
    }
}, 1000);

const retryBtn = document.getElementById("retry-btn");

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