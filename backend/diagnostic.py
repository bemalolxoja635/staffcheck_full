import google.generativeai as genai
import os
from decouple import config

def run_diagnostic():
    api_key = config('GEMINI_API_KEY')
    print(f"API Key starting with: {api_key[:8]}...")
    
    try:
        genai.configure(api_key=api_key)
        print("Checking models...")
        models = genai.list_models()
        available = []
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                available.append(m.name)
        
        if available:
            print("SUCCESS! Available models:")
            for name in available:
                print(f" - {name}")
        else:
            print("FAILED: No models with generateContent support found.")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")

if __name__ == "__main__":
    run_diagnostic()
