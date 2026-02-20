"""
AI Tagging Engine — HuggingFace + Keyword Fallback
----------------------------------------------------
Primary:  HuggingFace (facebook/bart-large-mnli)
Fallback: Keyword matching (if HuggingFace fails)

Tags: Technical | Urgent | General
"""

import requests

# ─── HuggingFace Configuration ────────────────────────────────────────────────
HF_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"
HF_API_KEY = "your-huggingface-api-key-here"  # ← Replace with your key
HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

CANDIDATE_LABELS = ["Technical", "Urgent", "General"]
VALID_TAGS       = ["Technical", "Urgent", "General"]


# ─── Keyword Fallback ─────────────────────────────────────────────────────────
KEYWORD_MAP = {
    'Technical': [
        'bug', 'error', 'code', 'function', 'api', 'database', 'server',
        'crash', 'exception', 'debug', 'algorithm', 'framework', 'library',
        'deployment', 'backend', 'frontend', 'sql', 'python', 'javascript',
        'flutter', 'react', 'django', 'git', 'repository', 'stack',
        'memory', 'performance', 'latency', 'endpoint', 'request', 'response',
        'json', 'rest', 'http', 'ssl', 'authentication', 'token', 'query',
        'migration', 'schema', 'model', 'component', 'module', 'syntax',
        'compile', 'runtime', 'null', 'undefined', 'traceback', 'log',
    ],
    'Urgent': [
        'urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline',
        'priority', 'blocker', 'production down', 'outage', 'broken',
        'failing', 'down', 'fix now', 'hotfix', 'as soon as possible',
        'time sensitive', 'escalate', 'escalation', 'p0', 'p1',
        'must', 'required by', 'overdue', 'breached', 'sla',
    ],
    'General': [
        'note', 'idea', 'thought', 'question', 'information', 'update',
        'meeting', 'discussion', 'summary', 'reminder', 'feedback',
        'suggestion', 'plan', 'overview', 'description', 'detail',
    ],
}


def _keyword_fallback(content: str) -> str:
    """Keyword-based tagger — fallback when HuggingFace fails."""
    normalized = content.lower()
    scores = {tag: 0 for tag in KEYWORD_MAP}

    for tag, keywords in KEYWORD_MAP.items():
        for keyword in keywords:
            if keyword in normalized:
                scores[tag] += 1

    if scores['Urgent'] > 0:
        return 'Urgent'

    best_tag = max(scores, key=lambda t: scores[t])
    return best_tag if scores[best_tag] > 0 else 'General'


def _huggingface_tag(content: str) -> str:
    """Uses HuggingFace zero-shot classification to tag the snippet."""
    payload = {
        "inputs": content,
        "parameters": {"candidate_labels": CANDIDATE_LABELS}
    }

    response = requests.post(HF_API_URL, headers=HF_HEADERS, json=payload, timeout=20)
    result   = response.json()

    # Format 1: {"labels": [...], "scores": [...]}
    if isinstance(result, dict) and "labels" in result:
        tag = result["labels"][0]
        if tag in VALID_TAGS:
            return tag

    # Format 2: [{"label": "...", "score": ...}]
    if isinstance(result, list) and len(result) > 0:
        first = result[0]
        if isinstance(first, dict) and "label" in first:
            tag = first["label"]
            if tag in VALID_TAGS:
                return tag
        if isinstance(first, list) and len(first) > 0:
            tag = first[0].get("label", "")
            if tag in VALID_TAGS:
                return tag

    return None


# ─── Main Function ────────────────────────────────────────────────────────────
def get_tag(content: str) -> str:
    """
    Tags snippet using 2-layer approach:
      1. HuggingFace (free, no quota issues)
      2. Keyword fallback (if HuggingFace fails)

    Args:
        content (str): The uploaded text snippet.

    Returns:
        str: One of 'Technical', 'Urgent', or 'General'.
    """
    if not content or not content.strip():
        return 'General'

    # ── Layer 1: HuggingFace ──────────────────────────────────────────────────
    try:
        tag = _huggingface_tag(content)
        if tag:
            print(f"[ai_tagger] HuggingFace tagged as: {tag}")
            return tag
        else:
            print("[ai_tagger] HuggingFace returned no tag. Using keyword fallback...")
    except Exception as e:
        print(f"[ai_tagger] HuggingFace error: {e}. Using keyword fallback...")

    # ── Layer 2: Keyword Fallback ─────────────────────────────────────────────
    tag = _keyword_fallback(content)
    print(f"[ai_tagger] Keyword fallback tagged as: {tag}")
    return tag