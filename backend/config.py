import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in environment")
if not GOOGLE_GEMINI_API_KEY:
    raise RuntimeError("GOOGLE_GEMINI_API_KEY is not set in environment")
