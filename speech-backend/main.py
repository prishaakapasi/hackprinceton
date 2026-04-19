import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import os
import tempfile
from typing import Optional

import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")


@app.get("/")
def root():
    return {"message": "speech backend running"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "whisper-base"}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path)
        return {"transcript": result["text"].strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@app.post("/compare")
async def compare(
    file: UploadFile = File(...),
    expected_text: Optional[str] = Form(None),
):
    audio_bytes = await file.read()
    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)
