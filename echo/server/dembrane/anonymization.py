# scripts/anonymization.py
import sys
from flair.data import Sentence
from flair.models import SequenceTagger
from langdetect import detect

# Define models for different languages
language_models = [
    {"lang": "nl", "model": SequenceTagger.load("flair/ner-dutch-large"), "person_tag": "PER", "replacement": "[Persoon]"},
    {"lang": "en", "model": SequenceTagger.load("xlm-roberta-large"), "person_tag": "PER", "replacement": "[Person]"}
]

def anonymize_text(text):
    try:
        detected_lang = detect(text)
    except Exception:
        detected_lang = "unknown"

    # Find the appropriate model
    tagger_info = next((lm for lm in language_models if lm["lang"] == detected_lang), None)
    if not tagger_info:
        return text

    tagger = tagger_info["model"]
    person_tag = tagger_info["person_tag"]
    replacement = tagger_info["replacement"]

    sentence = Sentence(text)
    tagger.predict(sentence)
    for entity in sentence.get_spans("ner"):
        if entity.tag == person_tag:
            text = text.replace(entity.text, replacement)
    return text

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No text provided")
        sys.exit(1)
    input_text = sys.argv[1]
    print(anonymize_text(input_text))
