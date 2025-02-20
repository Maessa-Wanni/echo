# dembrane/api/audio.py
from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil, os, subprocess

router = APIRouter()

@router.post("/diarization")
async def audio_diarization(file: UploadFile = File(...)):
    temp_dir = "./tmp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Adjust "python3" to "python" if necessary
        result = subprocess.check_output(["python3", "./scripts/diarization.py", temp_path])
        num_speakers = int(result.decode().strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {e}")
    finally:
        os.remove(temp_path)
    
    return {"num_speakers": num_speakers}
