from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

def load_data(path):
    with open(path, "r") as f:
        return json.load(f)

@app.route("/")
def index():
    flashcards = load_data("data/flashcards.json")
    return render_template("index.html", count=len(flashcards))

@app.route("/flashcards")
def flashcards():
    data = load_data("data/flashcards.json")
    return render_template("flashcards.html", flashcards=data)

@app.route("/quiz")
def quiz():
    questions = load_data("data/quiz.json")
    return render_template("quiz.html", questions=questions)

@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    app.run(debug=True)