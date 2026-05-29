# AI Utils mock for Vercel deployment (to avoid 250MB limit from generativeai/grpc)
import logging

logger = logging.getLogger(__name__)

def ask_gemini(prompt: str, context: str = "") -> str:
    return "AI yordamchi Vercel bepul serverida xotira cheklovi sababli vaqtincha o'chirilgan."

def analyze_image_with_gemini(image_data: bytes, prompt: str) -> str:
    return "Rasmdan o'qish imkoniyati (OCR) server xotirasi cheklovi sababli ayni paytda o'chirilgan."
