@echo off
pip install pyinstaller
pyinstaller --onefile --windowed --name "JARVIS-Voice-Search" ultimate_voice_search.py
echo ✅ JARVIS-Voice-Search.exe created in dist folder!
pause
