import requests
import json
import base64
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def ask_gemini(prompt: str, context: str = "") -> str:
    try:
        model_name = 'gemini-1.5-flash'
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
        
        full_prompt = f"{context}\n\nUser: {prompt}" if context else prompt
        
        payload = {
            "contents": [{
                "parts": [{"text": full_prompt}]
            }]
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return "Kechirasiz, AI yordamchi bilan ulanishda xatolik yuz berdi."

def analyze_image_with_gemini(image_data: bytes, prompt: str) -> str:
    try:
        model_name = 'gemini-1.5-flash'
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
        
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        logger.error(f"Gemini OCR error: {str(e)}")
        return "Rasmdan o'qishda xatolik yuz berdi."
