# scripts/diarization.py
import sys
from pyannote.audio import Pipeline

def count_speakers(audio_file):
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")
    diarization = pipeline(audio_file)
    speakers = set()
    for segment, _, speaker in diarization.itertracks(yield_label=True):
        speakers.add(speaker)
    return len(speakers)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No audio file provided")
        sys.exit(1)
    audio_file = sys.argv[1]
    print(count_speakers(audio_file))
