# scripts/keywords.py
import sys
from rake_nltk import Rake

def extract_keywords(text):
    r = Rake()
    r.extract_keywords_from_text(text)
    keywords = r.get_ranked_phrases()
    return keywords

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No text provided")
        sys.exit(1)
    text = sys.argv[1]
    keywords = extract_keywords(text)
    print(", ".join(keywords))
