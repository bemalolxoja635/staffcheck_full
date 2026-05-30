import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Configure the API key using settings
genai.configure(api_key=settings.GEMINI_API_KEY)

def ask_gemini(prompt: str, context: str = "") -> str:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        full_prompt = f"{context}\n\nUser: {prompt}" if context else prompt
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return "Kechirasiz, AI yordamchi bilan ulanishda xatolik yuz berdi."

def analyze_image_with_gemini(image_data: bytes, prompt: str) -> str:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([
            {'mime_type': 'image/jpeg', 'data': image_data},
            prompt
        ])
        return response.text
    except Exception as e:
        logger.error(f"Gemini OCR error: {str(e)}")
        return "Rasmdan o'qishda xatolik yuz berdi."
