from flask import Flask, render_template, request
import json
import random

app = Flask(__name__)

with open("data/questions.json", "r") as f:
    questions = json.load(f)

def load_data(path):
    with open(path, "r") as f:
        return json.load(f)

@app.route("/categories")
def categories():
    categories = sorted(set(q["category"] for q in questions))
    return render_template("categories.html", categories=categories)

@app.route("/")
def index():
    flashcards = load_data("data/flashcards.json")
    return render_template("index.html", count=len(flashcards))

@app.route("/flashcards")
def flashcards():
    data = load_data("data/flashcards.json")
    return render_template("flashcards.html", flashcards=data)

@app.route("/quiz/<category>")
def quiz(category):
    count = int(request.args.get("count", 5))

    # filter questions by category
    filtered = [q for q in questions if q.get("category") == category]

    # shuffle for randomness
    random.shuffle(filtered)

    # if requested count is more than available, use all
    if len(filtered) < count:
        selected_questions = filtered
    else:
        selected_questions = filtered[:count]

    return render_template(
        "quiz.html",
        questions=selected_questions,
        category=category,
        total=len(selected_questions)
    )

@app.route("/quiz/mixed")
def mixed_quiz():
    count = int(request.args.get("count", 5))
    categories_param = request.args.get("categories", "")

    # split selected categories
    selected_categories = [c for c in categories_param.split(",") if c]

    # collect questions from all selected categories
    pooled_questions = [
        q for q in questions if q.get("category") in selected_categories
    ]

    # shuffle pooled questions
    random.shuffle(pooled_questions)

    # limit to requested count
    selected_questions = pooled_questions[:count]

    return render_template(
        "quiz.html",
        questions=selected_questions,
        category="Mixed",
        total=len(selected_questions)
    )

@app.route("/about")
def about():
    return render_template("about.html")


# Results Dashboard route
@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)