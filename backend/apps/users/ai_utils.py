import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Gemini sozlamalari
genai.configure(api_key=settings.GEMINI_API_KEY)

def get_gemini_model():
    """Mavjud modellardan birini tanlaydi"""
    models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
    for m_name in models_to_try:
        try:
            model = genai.GenerativeModel(m_name)
            # Oddiy test qilib ko'ramiz
            return model
        except Exception:
            continue
    return genai.GenerativeModel("gemini-pro") # Oxirgi chora

def ask_gemini(prompt: str, context: str = "") -> str:
    """
    Gemini API ga savol yuboradi va javob qaytaradi.
    Diagnostika natijasiga ko'ra model nomlarini ishlatamiz.
    """
    models_to_try = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash"]
    full_prompt = f"{context}\n\nSavol: {prompt}" if context else prompt
    
    last_error = None
    for m_name in models_to_try:
        try:
            model = genai.GenerativeModel(m_name)
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            last_error = e
            continue
    
    return f"Xatolik yuz berdi: {str(last_error)}"

def analyze_image_with_gemini(image_data: bytes, prompt: str) -> str:
    """
    Rasm (OCR yoki Liveness) tahlili uchun.
    """
    try:
        model = get_gemini_model()
        # Rasm formatini aniqlash (oddiyroq usulda)
        response = model.generate_content([
            prompt,
            {'mime_type': 'image/jpeg', 'data': image_data}
        ])
        return response.text
    except Exception as e:
        logger.error(f"Gemini Vision xatoligi: {e}")
        return f"Rasm tahlilida xatolik: {str(e)}"
