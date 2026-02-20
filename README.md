# 🧠 Smart Knowledge Base

> An AI-powered knowledge management system that automatically categorizes text snippets using Google Gemini. Built with Django REST Framework and React.

**Limi AI — Full Stack Developer Technical Assessment**
**Candidate:** Laraib Amjad

---

## 📌 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [AI Tagging Engine](#ai-tagging-engine)
- [Database](#database)
- [Project Structure](#project-structure)

---

## Overview

The Smart Knowledge Base allows users to upload text snippets through a clean, modern UI. Each snippet is automatically analyzed by Google Gemini and assigned one of three tags — **Technical**, **Urgent**, or **General**. Users can filter, search, edit, and delete snippets in real time.

**Key Features:**
- 🤖 AI-powered automatic tagging via HuggingFace (facebook/bart-large-mnli)
- 🔑 Keyword-based fallback engine (works even if HuggingFace fails)
- 🏷️ Tag filtering — Technical, Urgent, General
- 🔍 Full-text smart search
- ✏️ Edit snippets — AI automatically re-tags updated content
- 🗑️ Delete snippets with confirmation dialog
- ✅ Clean input validation with descriptive error messages
- 🎨 Apple-inspired UI with smooth animations
- 🧠 Self-drawing brain logo animation (redraws every 10 seconds)
- 📱 Fully responsive — mobile friendly

---

## System Architecture

```
Client (React)
     │
     │  HTTP Requests (JSON)
     ▼
Django REST Framework
     │
     ├── POST   /api/snippets/        →  Validate → AI Tag → Save
     ├── GET    /api/snippets/        →  Filter by tag + Search
     ├── GET    /api/snippets/<id>/   →  Single snippet
     ├── PUT    /api/snippets/<id>/   →  Edit + AI Re-tag
     └── DELETE /api/snippets/<id>/   →  Delete
                    │
              AI Tagger (ai_tagger.py)
                    │
           ┌────────┴────────┐
           │                 │
     HuggingFace       Keyword Fallback
     (Primary)         (if HuggingFace fails)
                    │
             SQLite / PostgreSQL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Django 4.x |
| REST API | Django REST Framework |
| AI Engine | HuggingFace (facebook/bart-large-mnli) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| CORS Handling | django-cors-headers |
| Language | Python 3.x (PEP8 compliant) |
| Frontend | React.js |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- Git

---

### Backend Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/itx-LaraibAmjad/smart-knowledge-base
cd smart-knowledge-base
```

#### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

> If `requirements.txt` is missing, install manually:
> ```bash
> pip install django djangorestframework django-cors-headers requests
> ```

#### 4. Get & Add Your HuggingFace API Key

**Step 1** — Create your free API key:
1. Go to: https://huggingface.co
2. Sign up or Login
3. Click your profile (top right) → **Settings** → **Access Tokens**
4. Click **New Token** → enter a name → select **Read** → click Generate
5. Copy the token (it looks like: `hf_xxxxxxxxxxxxxxxxx`)

**Step 2** — Add the key to the project:

Open `api/ai_tagger.py` and find this line:
```python
HF_API_KEY = "your-huggingface-api-key-here"
```
Paste your copied key here:
```python
HF_API_KEY = "hf_xxxxxxxxxxxxxxxxx"  # ← your key here
```

> ⚠️ **Note:** Never share your API key with anyone or push it to GitHub.

#### 5. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### 6. Start Backend Server
```bash
python manage.py runserver
```
API live at: **`http://127.0.0.1:8000/api/`**

---

### Frontend Setup

#### 1. Go to frontend folder
```bash
cd frontend
```

#### 2. Install dependencies
```bash
npm install
npm install lucide-react
```

#### 3. Start React app
```bash
npm start
```
App live at: **`http://localhost:3000`**

---

## API Reference

### `POST /api/snippets/`
Upload a new snippet. AI auto-assigns tag.

**Request:**
```json
{ "content": "There is a critical bug in the login API." }
```
**Response `201`:**
```json
{
  "message": "Snippet uploaded and tagged successfully.",
  "data": { "id": 1, "content": "...", "ai_tag": "Technical", "created_at": "..." }
}
```

---

### `GET /api/snippets/`
Retrieve all snippets. Supports filters.

| Param | Example |
|---|---|
| `?tag=Technical` | Filter by tag |
| `?search=login` | Search in content |
| `?tag=Urgent&search=fix` | Combined |

---

### `GET /api/snippets/<id>/`
Get single snippet by ID.

---

### `PUT /api/snippets/<id>/`
Edit snippet. AI automatically re-tags the new content.

**Request:**
```json
{ "content": "Updated content here." }
```
**Response `200`:**
```json
{
  "message": "Snippet updated and re-tagged successfully.",
  "data": { "id": 1, "content": "...", "ai_tag": "General", "created_at": "..." }
}
```

---

### `DELETE /api/snippets/<id>/`
Delete a snippet permanently.

**Response `200`:**
```json
{ "message": "Snippet #1 deleted successfully." }
```

---

## AI Tagging Engine

Located in `api/ai_tagger.py`. Uses a **two-layer approach**:

### Layer 1 — HuggingFace (Primary)
Uses `facebook/bart-large-mnli` zero-shot classification model. Completely free, no quota issues. Understands context and nuance without any training.

### Layer 2 — Keyword Matching (Fallback)
Auto-activates if HuggingFace fails for any reason. App never crashes.

| Tag | When Applied |
|---|---|
| **Technical** | Code, bugs, APIs, databases, servers, software |
| **Urgent** | Time-sensitive, emergencies, deadlines, production issues |
| **General** | Notes, ideas, meetings, general information |

> **Priority Rule:** Urgent always wins over Technical if both match.

---

## Database

**Development** — SQLite (zero config, auto-created on migrate)

**Production** — Switch to PostgreSQL in `settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'knowledge_base_db',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```
Then: `pip install psycopg2-binary`

### Schema — `api_knowledgeitem`

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Auto-incremented |
| `content` | Text | Snippet text (max 2000 chars) |
| `ai_tag` | Varchar(20) | Technical / Urgent / General |
| `created_at` | DateTime | Auto-set on creation |

---

## Project Structure

```
smart-knowledge-base/
├── README.md              ← Project documentation
├── requirements.txt       ← Python dependencies
├── .gitignore             ← Git ignore rules
├── manage.py
├── knowledge_base/
│   ├── settings.py        ← Config, CORS, DB, DRF
│   ├── urls.py            ← Root routing
│   └── wsgi.py
├── api/
│   ├── models.py          ← KnowledgeItem model
│   ├── serializers.py     ← Validation & serialization
│   ├── views.py           ← GET, POST, PUT, DELETE logic
│   ├── urls.py            ← API routing
│   ├── ai_tagger.py       ← Gemini AI + keyword fallback
│   ├── admin.py           ← Django admin
│   └── apps.py
└── frontend/
    ├── public/
    └── src/
        ├── App.js         ← Main React component
        └── App.css        ← Styling & animations
```

---

## Author

**Laraib Amjad**
Full Stack Developer — Flutter / React & Django
Technical Assessment Submission for Limi AI