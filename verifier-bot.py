import json
import os
import sys
from playwright.sync_api import sync_playwright

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config', 'blocker-config.json')

def verify_youtube_selectors():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config_data = json.load(f)
    
    selectors = config_data.get("selectors", {})

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto("https://www.youtube.com/watch?v=dQw4w9WgXcQ", wait_until="networkidle")
            
            # Validar reproductor principal
            video_element = page.query_selector(selectors.get("videoPlayer"))
            if not video_element:
                raise Exception(f"Selector no encontrado: {selectors.get('videoPlayer')}")
                
            print("✅ Verificación completada: Los selectores responden adecuadamente.")
            
        except Exception as e:
            print(f"❌ Error durante el sondaje: {str(e)}")
            # Guardar captura del DOM para depuración
            with open("dom_snapshot.html", "w", encoding="utf-8") as snapshot:
                snapshot.write(page.content())
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    verify_youtube_selectors()