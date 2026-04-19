import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import json
import os
import subprocess
import tempfile
from typing import Optional

import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

PHRASES_FILE = "phrases.json"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    )
    return output_path


def load_phrases():
    if not os.path.exists(PHRASES_FILE):
        return []
    with open(PHRASES_FILE, "r") as f:
        return json.load(f)


def save_phrases_list(phrases):
    with open(PHRASES_FILE, "w") as f:
        json.dump(phrases, f, indent=2)


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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)
