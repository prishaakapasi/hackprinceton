import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import json
import os
import subprocess
import tempfile
from datetime import datetime
from typing import List, Optional

import whisper
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

PHRASES_FILE = "phrases.json"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")


def convert_to_wav(input_path: str) -> str:
    output_path = input_path + ".wav"
    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ar", "16000",
        "-ac", "1",
        output_path,
    ]
    subprocess.run(
        command,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        timeout=20,
    )
    return output_path


def load_phrases() -> List[str]:
    if not os.path.exists(PHRASES_FILE):
        return []
    with open(PHRASES_FILE, "r") as f:
        return json.load(f)


def save_phrases_list(phrases: List[str]) -> None:
    with open(PHRASES_FILE, "w") as f:
        json.dump(phrases, f, indent=2)


class SuggestRequest(BaseModel):
    transcript: str = ""
    partial: str = ""
    phrases: List[str] = []


@app.get("/")
def root():
    return {"message": "speech backend running"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "whisper-base"}


@app.get("/get-phrases")
def get_phrases():
    return {"phrases": load_phrases()}


@app.post("/save-phrase")
async def save_phrase(
    phrase: str = Form(...),
    audio: Optional[UploadFile] = File(None),  # reserved for future voice recording storage
):
    phrases = load_phrases()

    if phrase not in phrases:
        phrases.append(phrase)
        save_phrases_list(phrases)

    return {"ok": True, "phrases": phrases}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty file upload")

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    wav_path = None

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        wav_path = convert_to_wav(tmp_path)
        result = model.transcribe(wav_path)
        return {"transcript": result["text"].strip()}
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=400, detail="Could not decode audio file")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Audio conversion timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)


@app.post("/compare")
async def compare(
    file: UploadFile = File(...),
    expected_text: Optional[str] = Form(None),
):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty file upload")

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    wav_path = None

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        wav_path = convert_to_wav(tmp_path)
        result = model.transcribe(wav_path)
        standard = result["text"].strip()

        improved = standard
        comparison_mode = "baseline_only"

        if expected_text and expected_text.strip():
            improved = expected_text.strip()
            comparison_mode = "reference_override"

        return {
            "standard": standard,
            "improved": improved,
            "comparison_mode": comparison_mode,
        }
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=400, detail="Could not decode audio file")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Audio conversion timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)


@app.post("/suggest")
def suggest(req: SuggestRequest):
    phrases = req.phrases if req.phrases else load_phrases()
    query = (req.partial or req.transcript or "").strip().lower()

    ranked = []

    if query:
        query_words = [w for w in query.split() if w]
        for phrase in phrases:
            phrase_lower = phrase.lower()
            score = 0
            if query in phrase_lower:
                score += 10
            for word in query_words:
                if word in phrase_lower:
                    score += 1
            ranked.append((score, phrase))
        ranked.sort(key=lambda x: (-x[0], x[1]))
        suggestions = [phrase for score, phrase in ranked if score > 0]
    else:
        suggestions = []

    for phrase in phrases:
        if phrase not in suggestions:
            suggestions.append(phrase)

    return {"suggestions": suggestions[:5]}


@app.get("/medication-mode")
def medication_mode():
    hour = datetime.now().hour
    mode = "on" if 8 <= hour < 20 else "off"
    return {"mode": mode}
