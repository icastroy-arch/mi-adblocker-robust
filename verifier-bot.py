import time
import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config', 'blocker-config.json')

# Lista de selectores potenciales conocidos
KNOWN_SELECTORS = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    "button[id^='skip-button']",
    ".ytp-ad-skip-button-container button",
    "[class*='skip-button']"
]

def scan_and_update():
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🤖 Bot escaneando YouTube...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Navegar a un video de prueba
            page.goto("https://www.youtube.com/watch?v=zRzLmihJ_r8", wait_until="domcontentloaded")
            time.sleep(3) # Esperar a que cargue el reproductor
            
            # Buscar si existe alguno de los selectores en el DOM
            found_selectors = []
            for sel in KNOWN_SELECTORS:
                if page.locator(sel).count() > 0:
                    found_selectors.append(sel)
            
            if found_selectors:
                print(f"✅ Selectores detectados activos en YouTube: {found_selectors}")
            else:
                print("ℹ️ No se detectaron anuncios activos en este momento, manteniendo selectores por defecto.")

            # Leer y actualizar el archivo blocker-config.json con timestamp
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                config['last_bot_check'] = datetime.now().isoformat()
                
                with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=2)
                
                print("🔄 blocker-config.json actualizado e informado al servidor local.")
                
        except Exception as e:
            print(f"⚠️ Error durante el escaneo: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    print("🚀 Bot en segundo plano iniciado. Se ejecutará cada 30 minutos.")
    while True:
        scan_and_update()
        print("⏳ Esperando 30 minutos para la siguiente verificación...")
        time.sleep(1800) # 30 minutos en segundos