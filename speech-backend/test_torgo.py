"""
Run standard Whisper on a TORGO audio clip to demonstrate poor transcription.

Usage:
  python test_torgo.py <path-to-wav>

Example:
  python test_torgo.py torgo_samples/MC01_001.wav
"""
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import sys
import whisper

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_torgo.py <path-to-wav>")
        sys.exit(1)

    audio_path = sys.argv[1]
    print(f"\nLoading Whisper base model...")
    model = whisper.load_model("base")

    print(f"Transcribing: {audio_path}")
    result = model.transcribe(audio_path)

    print("\n" + "="*50)
    print("WHISPER OUTPUT:")
    print(f"  \"{result['text'].strip()}\"")
    print("="*50)
    print("\nThis is what standard Whisper produces on dysarthric speech.")
    print("The demo goal: show this fails, then show our fine-tuned model does better.\n")

if __name__ == "__main__":
    main()
