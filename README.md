# Flashcard Quiz App

A Flask-based web application for studying with flashcards and taking quizzes across different categories.

## Features

- 📇 Flashcards for studying
- 📝 Multiple choice quizzes
- 📂 Categories for organized learning
- 📊 Results dashboard
- 🔀 Mixed quizzes from multiple categories

## Project Structure

```
flashcard_app/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── data/               # Data files
│   ├── flashcards.json
│   ├── questions.json
│   ├── questions.py
│   └── quiz.json
├── static/             # Static assets
│   ├── css/style.css
│   └── js/main.js
└── templates/          # HTML templates
    ├── base.html
    ├── index.html
    ├── about.html
    ├── categories.html
    ├── flashcards.html
    ├── quiz.html
    └── dashboard.html
```

## Environment Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Step 1: Create Virtual Environment

Navigate to the project directory and create a virtual environment:

```bash
cd /Users/shubhamsharma/flashcard_app
python3 -m venv venv
```

### Step 2: Activate Virtual Environment

**macOS/Linux:**

```bash
source venv/bin/activate
```

**Windows:**

```bash
venv\Scripts\activate
```

You should see `(venv)` prefix in your terminal, indicating the virtual environment is active.

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

The `requirements.txt` contains:

- `flask>=2.0.0` - Web framework

### Step 4: Run the Application

```bash
python app.py
```

The application will start in debug mode at `http://127.0.0.1:5000/`

## Available Routes

| Route              | Method | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| `/`                | GET    | Home page with flashcard count           |
| `/flashcards`      | GET    | View all flashcards                      |
| `/categories`      | GET    | View all quiz categories                 |
| `/quiz/<category>` | GET    | Take quiz in specific category           |
| `/quiz/mixed`      | GET    | Take mixed quiz from selected categories |
| `/dashboard`       | GET    | View quiz results dashboard              |
| `/about`           | GET    | About page                               |

## Example Usage

### Starting a Category Quiz

Visit: `http://127.0.0.1:5000/quiz/science`

### Starting a Mixed Quiz

Visit: `http://127.0.0.1:5000/quiz/mixed?categories=history,geography&count=10`

### Query Parameters for Quiz Routes

- `count` - Number of questions (default: 5)
- `categories` - Comma-separated list of categories (for mixed quiz)

## Deactivating the Virtual Environment

When you're done working on the project:

```bash
deactivate
```

## Reactivating Later

To work on the project again:

```bash
cd /Users/shubhamsharma/flashcard_app
source venv/bin/activate
python app.py
```

## Dependencies

If you need to add new dependencies:

```bash
pip install <package-name>
pip freeze > requirements.txt
```

## License

MIT License
