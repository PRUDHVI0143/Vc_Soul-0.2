# 🌌 Vc Soul — S.O.U.L. Voice Assistant

**S.O.U.L.** (System of Universal Listening) is a voice-activated AI assistant with a premium web HUD interface built with React + Vite and a Python/Eel backend.

---

## 🚀 Features

- 🎤 **Wake-word activation** — Say *"Hello Bro"* to wake up
- 🧠 **Dual AI** — Online (Gemini 2.5 Flash) + Offline (Phi-3) fallback
- 🌐 **Smart web navigation** — Opens Netflix, YouTube, GitHub, and 30+ sites
- 🖥️ **Windows app launcher** — Calc, Notepad, VS Code, Discord, etc.
- 🗣️ **Text-to-speech** responses via pyttsx3
- 💬 **Conversational** — Jokes, facts, time, date, identity responses
- 🎨 **Premium HUD UI** — Cyberpunk aesthetic with animated orb

---

## 📂 Project Structure

```
Vc_Soul-0.2/
├── src/                        # React frontend (Vite)
│   ├── App.jsx                 # Main dashboard UI
│   └── index.css
├── public/
│   └── expose.js               # JS ↔ Python bridge
├── Vc-Soul-Voice-Search/       # Python backend (Eel)
│   ├── ultimate_voice_search.py  # Main assistant logic
│   ├── web/                    # Eel HTML interface
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── install.bat             # Windows dependency installer
│   ├── install.sh              # Linux/Mac installer
│   └── requirements_ai.txt     # Python dependencies
├── index.html                  # Vite entry
├── package.json
└── vite.config.js
```

---

## ⚙️ Setup & Run

### Python Backend (Eel UI)

```bash
cd Vc-Soul-Voice-Search
pip install -r requirements_ai.txt
python ultimate_voice_search.py
```

### React Frontend (Dev)

```bash
npm install
npm run dev
```

---

## 🗣️ Voice Commands

| Say | Action |
|-----|--------|
| `Hello Bro` | Wake up S.O.U.L. |
| `Open Netflix` | Opens Netflix |
| `Search python tutorial` | Google search |
| `YouTube lo-fi music` | YouTube search |
| `What is black holes` | AI answer (Gemini) |
| `Tell me a joke` | Random joke |
| `What time is it` | Current time |
| `Goodbye` | Sleep mode |

---

## 🔑 API Key

Add your Gemini API key in `ultimate_voice_search.py`:

```python
self.gemini_key = "YOUR_GEMINI_API_KEY_HERE"
```

Get a free key at: https://aistudio.google.com/app/apikey

---

## 📦 Python Requirements

```
SpeechRecognition
pyttsx3
pyaudio
eel
requests
google-generativeai
```

---

*Built with ❤️ by PRUDHVI0143*
