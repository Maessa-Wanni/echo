# scripts/sentiment.py
import sys
from transformers import pipeline

def analyze_sentiment(text):
    classifier = pipeline("sentiment-analysis")
    result = classifier(text)
    # You can customize how you return the result
    return result[0]['label']

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No text provided")
        sys.exit(1)
    text = sys.argv[1]
    print(analyze_sentiment(text))
