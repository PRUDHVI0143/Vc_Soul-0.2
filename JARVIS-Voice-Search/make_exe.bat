@echo off
pip install pyinstaller
pyinstaller --onefile --windowed --name "Vc-Soul-Voice-Search" ultimate_voice_search.py
echo ✅ Vc-Soul-Voice-Search.exe created in dist folder!
pause
