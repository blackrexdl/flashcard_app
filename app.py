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
    filtered = [q for q in questions if q["category"] == category]
    random.shuffle(filtered)
    selected_questions = filtered[:count]
    return render_template(
        "quiz.html",
        questions=selected_questions,
        category=category
    )

@app.route("/about")
def about():
    return render_template("about.html")
if __name__ == "__main__":
    app.run(debug=True)