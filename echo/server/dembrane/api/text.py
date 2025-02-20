# dembrane/api/text.py
from fastapi import APIRouter, HTTPException
import subprocess

router = APIRouter()

@router.post("/anonymize")
async def anonymize_text(text: str):
    try:
        result = subprocess.check_output(["python3", "./scripts/anonymization.py", text])
        anonymized_text = result.decode().strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anonymization error: {e}")
    return {"anonymized_text": anonymized_text}

@router.post("/sentiment")
async def sentiment_analysis(text: str):
    try:
        result = subprocess.check_output(["python3", "./scripts/sentiment.py", text])
        sentiment = result.decode().strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis error: {e}")
    return {"sentiment": sentiment}

@router.post("/keywords")
async def keyword_extraction(text: str):
    try:
        result = subprocess.check_output(["python3", "./scripts/keywords.py", text])
        keywords = result.decode().strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Keyword extraction error: {e}")
    return {"keywords": keywords.split(", ") if keywords else []}

@router.post("/summarize")
async def text_summarization(text: str):
    try:
        result = subprocess.check_output(["python3", "./scripts/summarization.py", text])
        summary = result.decode().strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization error: {e}")
    return {"summary": summary}
