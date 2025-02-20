# scripts/summarization.py
import sys
from transformers import pipeline

def summarize_text(text):
    summarizer = pipeline("summarization")
    summary = summarizer(text, max_length=130, min_length=30, do_sample=False)
    return summary[0]['summary_text']

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No text provided")
        sys.exit(1)
    text = sys.argv[1]
    print(summarize_text(text))
