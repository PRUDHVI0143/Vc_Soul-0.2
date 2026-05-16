#!/usr/bin/env python3
"""
🌌 S.O.U.L v2.0 - System of Universal Listening
  Wake word: "Hello Bro"
  Conversational voice assistant with Web HUD UI
"""
import subprocess, platform, threading, urllib.parse, time, re, os, sys, queue
import speech_recognition as sr
import pyttsx3
import winsound
import eel

# Ensure stdout/stderr are never None (fixes pythonw.exe crash from Desktop shortcuts)
log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "soul.log")
log_file = open(log_path, "a", encoding="utf-8", buffering=1)

class Tee:
    def __init__(self, stream1, stream2):
        self.stream1 = stream1
        self.stream2 = stream2
    def write(self, data):
        if self.stream1:
            try:
                self.stream1.write(data)
                self.stream1.flush()
            except: pass
        if self.stream2:
            try:
                self.stream2.write(data)
                self.stream2.flush()
            except: pass
    def flush(self):
        if self.stream1:
            try: self.stream1.flush()
            except: pass
        if self.stream2:
            try: self.stream2.flush()
            except: pass

sys.stdout = Tee(sys.stdout, log_file)
sys.stderr = Tee(sys.stderr, log_file)


try:
    import requests
    import google.generativeai as genai
    ONLINE_AI_AVAILABLE = True
except ImportError:
    ONLINE_AI_AVAILABLE = False

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

try:
    import pygame
    PYGAME_AVAILABLE = True
    pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=4096)
except ImportError:
    PYGAME_AVAILABLE = False

WAKE_WORDS = ["hello bro", "hi bro", "hey bro", "bro"]

# Eel initialization
web_dir = os.path.join(os.path.dirname(__file__), 'web')
eel.init(web_dir)

class SoulAIBrain:
    def __init__(self):
        self.gemini_key = "AIzaSyAPSWWrNEw8ez0CM-mpLTz4Ti-1L8Drk6o"
        self.offline_model_name = "microsoft/Phi-3-mini-4k-instruct"
        self.offline_generator = None
        self.offline_ready = False
        self.is_loading_offline = False

        if ONLINE_AI_AVAILABLE and self.gemini_key != "YOUR_GEMINI_API_KEY_HERE":
            genai.configure(api_key=self.gemini_key)
            # gemini-2.5-flash is the current supported model in this environment
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.gemini_model = None

    def is_online(self):
        if not ONLINE_AI_AVAILABLE: return False
        try:
            # Using a real URL instead of an IP, as some networks block 8.8.8.8
            requests.get("https://www.google.com", timeout=3)
            return True
        except Exception as e:
            print(f"Connectivity Check Failed: {e}")
            return False

    def load_offline_model(self):
        if not TRANSFORMERS_AVAILABLE:
            print("Transformers not installed. Offline AI disabled.")
            return
        if self.offline_ready or self.is_loading_offline:
            return
        self.is_loading_offline = True
        try:
            print("Loading offline AI model (this may take a while)...")
            tokenizer = AutoTokenizer.from_pretrained(self.offline_model_name)
            model = AutoModelForCausalLM.from_pretrained(self.offline_model_name)
            self.offline_generator = pipeline("text-generation", model=model, tokenizer=tokenizer, device=-1)
            self.offline_ready = True
            print("Offline AI model loaded.")
        except Exception as e:
            print("Failed to load offline AI:", e)
        finally:
            self.is_loading_offline = False

    def generate(self, query):
        current_time = time.strftime("%Y-%m-%d %H:%M:%S")
        if ONLINE_AI_AVAILABLE and self.gemini_model:
            try:
                # Giving context about the current date for "Recent Info"
                prompt = f"System: The current date and time is {current_time}. You are S.O.U.L, a highly advanced, intelligent AI voice assistant. Provide a clear, thorough, and engaging conversational explanation to this query, explaining the key details beautifully so the user fully understands: {query}"
                response = self.gemini_model.generate_content(prompt)
                
                if response.candidates and response.candidates[0].content.parts:
                    text = response.text.replace("*", "").replace("#", "").strip()
                    return text, "Online Gemini"
                else:
                    print("DEBUG: Gemini blocked response")
            except Exception as e:
                print(f"DEBUG: Online AI unavailable: {e}")
                # Smart Online Fallback: Wikipedia Knowledge Search
                try:
                    search_term = query
                    for w in ["who is", "what is", "where is", "tell me about", "why is", "how to", "explain"]:
                        search_term = search_term.replace(w, "")
                    search_term = search_term.strip()
                    if search_term:
                        url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&generator=search&gsrsearch={urllib.parse.quote(search_term)}&gsrlimit=1"
                        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=4).json()
                        pages = res.get('query', {}).get('pages', {})
                        if pages:
                            extract = list(pages.values())[0].get('extract', '')
                            if extract:
                                sentences = [s.strip() for s in extract.split('. ') if s.strip()]
                                summary = '. '.join(sentences[:2]) + '.'
                                return summary, "Online Knowledge Base"
                except Exception as wiki_e:
                    print(f"DEBUG: Wikipedia fallback failed: {wiki_e}")
        
        # Fallback if offline or API error
        if not self.offline_ready:
            # Start background loading if not already
            if TRANSFORMERS_AVAILABLE and not self.is_loading_offline:
                threading.Thread(target=self.load_offline_model, daemon=True).start()
            return "I am currently offline and my local AI is initializing. Please give me a moment to load my offline brain.", "Offline Loading"
        
        try:
            prompt = f"System Date: {current_time}. You are S.O.U.L, a helpful voice assistant. Answer concisely: {query}"
            res = self.offline_generator(prompt, max_new_tokens=100, do_sample=True, temperature=0.7)[0]['generated_text']
            answer = res.split(prompt)[-1].strip()
            return answer, "Offline Phi-3"
        except Exception as e:
            print("Offline AI Error:", e)
            return "I'm having trouble thinking offline right now.", "Offline Error"

    def get_images(self, query):
        try:
            url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrlimit=2&pithumbsize=500"
            res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}).json()
            images = [v['thumbnail']['source'] for k,v in res.get('query', {}).get('pages', {}).items() if 'thumbnail' in v]
            return images[:2]
        except Exception as e:
            print("Image fetch error:", e)
            return []

class SoulAssistant:
    def __init__(self):
        self.ai_brain = SoulAIBrain()
        self.r = sr.Recognizer()
        self.r.energy_threshold = 400
        self.r.dynamic_energy_threshold = True
        try:
            self.mic = sr.Microphone()
        except Exception:
            self.mic = None
            
        self._mic_ready = False
        self._active = False
        self.selected_voice = "offline"
        self.elevenlabs_key = ""
        
        # Text-to-Speech Queue
        self.tts_queue = queue.Queue()
        threading.Thread(target=self._tts_worker, daemon=True).start()

        # Threading events
        self._mic_event = threading.Event()
        self._stop_event = threading.Event()

    # ── State Updates (Bridged to JS) ────────────────
    def _ui_update(self, state, status_text=None, dot_color=None, main_text=None):
        try:
            eel.updateState(state, status_text, dot_color, main_text)
        except Exception as e:
            print("Eel UI update failed:", e)

    # ── TTS ──────────────────────────────────────
    def _tts_worker(self):
        engine = pyttsx3.init()
        engine.setProperty('rate', 170)
        engine.setProperty('volume', 1.0)
        while True:
            text, auto_sleep = self.tts_queue.get()
            
            eleven_played = False
            if hasattr(self, 'selected_voice') and self.selected_voice != "offline":
                audio_content = None
                # 1. Try ElevenLabs API first if key is present
                key = getattr(self, 'elevenlabs_key', "").strip()
                if key:
                    try:
                        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.selected_voice}"
                        headers = {"xi-api-key": key, "Content-Type": "application/json"}
                        payload = {
                            "text": text, "model_id": "eleven_monolingual_v1",
                            "voice_settings": {"stability": 0.5, "similarity_boost": 0.7}
                        }
                        res = requests.post(url, json=payload, headers=headers, timeout=5)
                        if res.status_code == 200:
                            audio_content = res.content
                        else:
                            print(f"ElevenLabs API Error {res.status_code}, attempting Google Neural Fallback")
                    except Exception as el_e:
                        print("ElevenLabs request error, attempting Google Neural Fallback:", el_e)
                
                # 2. Smart Free Neural Fallback (Google Translate TTS) if ElevenLabs failed or no key
                if not audio_content:
                    try:
                        tld_map = {
                            "2zRM7PkgwBPiau2jvVXc": "com",     # Aria -> US Neural
                            "2BsEFcU7jUhLaUwV4h7l": "co.uk",   # Marcus -> UK British Neural
                            "DKSYnVsGaIwlOF31S3sV": "ca",      # Sarah -> Canadian Neural
                            "4O1sYUnmtThcBoSBrri7": "com.au"   # David -> Australian Neural
                        }
                        tld = tld_map.get(self.selected_voice, "com")
                        
                        import textwrap
                        chunks = textwrap.wrap(text, width=180)
                        combined_audio = b""
                        
                        for chunk in chunks:
                            g_url = f"https://translate.google.{tld}/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q={urllib.parse.quote(chunk)}"
                            g_res = requests.get(g_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
                            if g_res.status_code == 200:
                                combined_audio += g_res.content
                        
                        if combined_audio:
                            audio_content = combined_audio
                            print("DEBUG: Successfully fetched and combined Google Neural AI Voice fallback for full explanation")
                    except Exception as g_e:
                        print("Google Neural Fallback error:", g_e)

                # 3. Play the resulting audio stream
                if audio_content:
                    temp_mp3 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_speech.mp3")
                    with open(temp_mp3, "wb") as f:
                        f.write(audio_content)
                    
                    try:
                        if PYGAME_AVAILABLE:
                            try:
                                pygame.mixer.music.load(temp_mp3)
                                pygame.mixer.music.play()
                                while pygame.mixer.music.get_busy():
                                    time.sleep(0.1)
                                pygame.mixer.music.unload()
                                eleven_played = True
                            except Exception as pg_e:
                                print("Pygame playback error, trying MCI:", pg_e)
                        
                        if not eleven_played:
                            import ctypes
                            clean_path = temp_mp3.replace('\\', '/')
                            ctypes.windll.winmm.mciSendStringW('close temp_audio', None, 0, None)
                            res = ctypes.windll.winmm.mciSendStringW(f'open "{clean_path}" alias temp_audio', None, 0, None)
                            if res == 0:
                                ctypes.windll.winmm.mciSendStringW('play temp_audio wait', None, 0, None)
                                ctypes.windll.winmm.mciSendStringW('close temp_audio', None, 0, None)
                                eleven_played = True
                            else:
                                raise Exception(f"MCI Error code {res}")
                    except Exception as play_e:
                        print("Audio playback error, falling back to pyttsx3:", play_e)
            
            if not eleven_played:
                try:
                    engine.say(text)
                    engine.runAndWait()
                except Exception as e:
                    print("TTS Error:", e)
            
            if auto_sleep:
                time.sleep(15) # Increased auto-sleep to 15 seconds to allow full voice over explanation
                if self._active:
                    self._deactivate()

    def clean_for_speech(self, text):
        cleaned = re.sub(r'[*#_~`\[\]()]', '', text)
        cleaned = re.sub(r'[^\w\s.,!?\'"-]', '', cleaned)
        return cleaned.strip()

    def speak(self, text):
        self.tts_queue.put((text, False))

    def _speak_and_resume(self, text):
        self.tts_queue.put((text, True))

    # ── Site resolver ────────────────────────────
    def normalize(self, t):
        fixes = {
            "netfilx":"netflix","netfile":"netflix","net flix":"netflix",
            "you tube":"youtube","youtub":"youtube",
            "disney plus":"disney","prime":"amazon","amazon prime":"amazon",
            "insta":"instagram","tik tok":"tiktok","red it":"reddit",
            "stack overflow":"stackoverflow",
            "ani wave":"aniwave","any wave":"aniwave","aniwaves":"aniwave","anime":"aniwave",
            "i bomma":"ibomma",
        }
        t = t.lower().strip()
        return fixes.get(t, t)

    def get_url(self, name):
        sites = {
            "netflix":"https://www.netflix.com","youtube":"https://www.youtube.com",
            "hulu":"https://www.hulu.com","disney":"https://www.disneyplus.com",
            "amazon":"https://www.amazon.com","prime video":"https://www.primevideo.com",
            "spotify":"https://open.spotify.com","instagram":"https://www.instagram.com",
            "twitter":"https://twitter.com","facebook":"https://www.facebook.com",
            "tiktok":"https://www.tiktok.com","reddit":"https://www.reddit.com",
            "linkedin":"https://www.linkedin.com","whatsapp":"https://web.whatsapp.com",
            "ebay":"https://www.ebay.com","flipkart":"https://www.flipkart.com",
            "google":"https://www.google.com","bing":"https://www.bing.com",
            "github":"https://github.com","stackoverflow":"https://stackoverflow.com",
            "wikipedia":"https://www.wikipedia.org","gmail":"https://mail.google.com",
            "drive":"https://drive.google.com","maps":"https://maps.google.com",
            "translate":"https://translate.google.com","chatgpt":"https://chat.openai.com",
            "help me code":"https://claude.ai/new",
            "claude":"https://claude.ai/new",
            "suggestion of plan":"https://gemini.google.com/app/25ee25024d52176e?is_sa=1&is_sa=1&android-min-version=301356232&ios-min-version=322.0&campaign_id=bkws&utm_source=sem&utm_medium=paid-media&utm_campaign=bkws&pt=9008&mt=8&ct=p-growth-sem-bkws&gclsrc=aw.ds&gad_source=1&gad_campaignid=20357620749&gbraid=0AAAAApk5BhkwkwTdfLEMKGGYa4-aVW3Ly&gclid=CjwKCAjwnZfPBhAGEiwAzg-VzBueThy90e3A5KdNU4hWObyQS5TSualVVjZTyW-lSdN6XaxbQtq9sxoCEm8QAvD_BwE",
            "gemini":"https://gemini.google.com/",
            "build box":"https://app.blackbox.ai/",
            "black box":"https://app.blackbox.ai/",
            "aniwave":"https://aniwaves.ru/",
            "manga":"https://mangafire.to/home",
            "ibomma":"https://bappam1.com/telugu-movies/",
        }
        return sites.get(self.normalize(name))

    def open_url(self, url):
        try:
            sys = platform.system()
            if sys == "Windows":
                subprocess.run(f'start brave "{url}"', shell=True, check=True)
            elif sys == "Darwin":
                subprocess.run(["open","-a","Brave Browser",url], check=True)
            else:
                subprocess.run(["brave-browser",url], check=True)
        except:
            import webbrowser; webbrowser.open(url)

    # ── Command handler ───────────────────────────
    def handle_command(self, raw):
        cmd = raw.lower().strip()
        self._ui_update("thinking", "PROCESSING", "#fbbc04", cmd.capitalize())
        
        try:
            winsound.PlaySound("SystemAsterisk", winsound.SND_ALIAS | winsound.SND_ASYNC)
        except: pass

        response = None

        # Exit/sleep
        if any(w in cmd for w in ["goodbye","bye","sleep","stop","exit","quit"]):
            response = "Going to sleep. Say 'Hello Bro' to wake me."
            self._ui_update("idle", "Waiting for you to say 'Hello Bro'...", "#9b66d6", "Sleeping...")
            self._active = False
            try: winsound.PlaySound("SystemExit", winsound.SND_ALIAS | winsound.SND_ASYNC)
            except: pass
            threading.Thread(target=lambda: self.speak(response), daemon=True).start()
            return

        # Rich Interaction Content (Small Talk & Utils)
        import random, datetime

        # 1. Greetings
        if cmd in ["hi", "hello", "hey", "hello bro", "hi bro", "hey bro", "hi soul", "hello soul"]:
            responses = [
                "Hello there! How can I help you today?", 
                "Greetings! What's on your mind?", 
                "Hi! I am here and ready to chat.",
                "Hey! It's great to hear from you.",
                "Hello! I am ready for your next command."
            ]
            response = random.choice(responses)
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return
            
        # 2. How are you / Status
        if any(w in cmd for w in ["how are you", "how are you doing", "what's up", "whats up", "how do you feel"]):
            responses = [
                "I'm functioning perfectly, thank you! How about you?", 
                "Doing great. What can I assist you with today?", 
                "All systems are online and optimal. Ready to help!",
                "I'm doing wonderful. Thanks for asking! Need anything?",
                "Feeling very energetic today. What's our mission?"
            ]
            response = random.choice(responses)
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # 3. Identity
        if any(w in cmd for w in ["who are you", "what are you", "your name", "who is soul"]):
            responses = [
                "I am S.O.U.L, your System of Universal Listening. I'm a highly advanced AI interface here to make your life easier.",
                "I am S.O.U.L, your personal assistant. I can open websites, search the web, and help you navigate your digital life.",
                "My name is S.O.U.L. I'm an intelligent voice assistant built to serve you."
            ]
            response = random.choice(responses)
            self._ui_update("wake", "LISTENING", "#00e5ff", "I am S.O.U.L.")
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # 4. Creator
        if any(w in cmd for w in ["who created you", "who made you", "your creator", "who is your boss"]):
            response = "I was created by a brilliant mind. My purpose is to be the ultimate voice search and assistance system."
            self._ui_update("wake", "LISTENING", "#00e5ff", "I have a great creator.")
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # 5. Capabilities
        if any(w in cmd for w in ["what can you do", "help me", "your features", "how can you help"]):
            response = "I can do many things. I can open apps, search the web, play YouTube videos, check the time, or even tell you a joke! Just ask."
            self._ui_update("wake", "LISTENING", "#00e5ff", "I can help with many things.")
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # 6. Compliments
        if any(w in cmd for w in ["you are awesome", "you are good", "good job", "nice work", "i love you", "you are smart"]):
            responses = [
                "Thank you! That means a lot to me.",
                "I appreciate that! I'm always trying my best to help.",
                "You're awesome too! We make a great team.",
                "Aww, thanks! You just made my day... if AIs had days, that is."
            ]
            response = random.choice(responses)
            self._ui_update("wake", "LISTENING", "#00e5ff", "Thank you!")
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # 7. Fun Facts
        if any(w in cmd for w in ["tell me a fact", "interesting fact", "did you know"]):
            facts = [
                "Did you know that the first computer bug was an actual real bug? It was a moth found in the Harvard Mark II computer.",
                "A jiffy is an actual unit of time. It's 1/100th of a second.",
                "The first electronic computer ENIAC weighed more than 27 tons and took up 1800 square feet.",
                "Did you know that water makes different pouring sounds depending on its temperature?",
                "Sharks have existed for longer than trees. They have been around for over 400 million years!"
            ]
            response = random.choice(facts)
            self._ui_update("wake", "LISTENING", "#00e5ff", "Here is a fact...")
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        if any(w in cmd for w in ["what time is it", "tell me the time", "current time"]):
            now = datetime.datetime.now().strftime("%I:%M %p")
            response = f"The current time is {now}."
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        if any(w in cmd for w in ["what is the date", "what's the date", "today's date"]):
            date = datetime.datetime.now().strftime("%B %d, %Y")
            response = f"Today is {date}."
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return
            
        if any(w in cmd for w in ["tell me a joke", "make me laugh"]):
            jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs.",
                "There are 10 types of people in the world: those who understand binary, and those who don't.",
                "I would tell you a UDP joke, but you might not get it.",
                "Why did the developer go broke? Because he used up all his cache.",
                "An SQL query goes into a bar, walks up to two tables and asks: Can I join you?",
                "How many programmers does it take to change a light bulb? None, that's a hardware problem."
            ]
            response = random.choice(jokes)
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # Local Windows Apps (Comprehensive List)
        local_apps = {
            "calculator": "calc",
            "camera": "start microsoft.windows.camera:",
            "calendar": "start outlookcal:",
            "settings": "start ms-settings:",
            "notepad": "notepad",
            "paint": "mspaint",
            "file explorer": "explorer",
            "task manager": "taskmgr",
            "command prompt": "cmd",
            "control panel": "control",
            "wordpad": "write",
            "snipping tool": "snippingtool",
            "mail": "start outlookmail:",
            "maps": "start bingmaps:",
            "weather": "start bingweather:",
            "photos": "start ms-photos:",
            "store": "start ms-windows-store:",
            "clock": "start ms-clock:",
            "alarms": "start ms-clock:",
            "xbox": "start xbox:",
            "word": "start winword",
            "excel": "start excel",
            "powerpoint": "start powerpnt",
            "chrome": "start chrome",
            "edge": "start msedge",
            "firefox": "start firefox",
            "brave": "start brave",
            "discord": "start discord",
            "vlc": "start vlc"
        }
        
        # 1. Check strict known app mappings
        for app_name, app_cmd in local_apps.items():
            if f"open {app_name}" in cmd or f"launch {app_name}" in cmd or (app_name in cmd and len(cmd.split()) <= 2):
                subprocess.run(app_cmd, shell=True)
                response = f"Opening {app_name} for you."
                self._ui_update("wake", "LISTENING", "#00e5ff", response)
                self._mic_event.set() # Resume listening
                threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
                return

        # Direct web open
        words = cmd.split()
        if len(words)>=2 and words[0] in ("open","go","launch","visit","browse","show"):
            site = self.normalize(" ".join(words[1:]))
            url = self.get_url(site)
            if url:
                self.open_url(url)
                response = f"Opening {site.title()}."
                self._ui_update("wake", "LISTENING", "#00e5ff", response)
                self._mic_event.set() # Resume listening
                threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
                return
            else:
                # Dynamic Windows App Fallback: If it's not a known website, let Windows try to open it as an app
                target = "".join(words[1:]) # e.g. "telegram" or "spotify"
                try:
                    res = subprocess.run(f"start {target}", shell=True, capture_output=True)
                    if res.returncode == 0:
                        response = f"Attempting to open {site}."
                        self._ui_update("wake", "LISTENING", "#00e5ff", response)
                        self._mic_event.set() # Resume listening
                        threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
                        return
                except:
                    pass

        # AI Knowledge Questions (what, who, why, where, how)
        ai_triggers = ["what", "who", "why", "where", "how", "tell"]
        words = cmd.split()
        if words and words[0] in ai_triggers:
            self._ui_update("thinking", "AI Brain Processing...", "#fbbc04", "Let me think...")
            
            # Run AI generation and Image fetching in parallel to save time
            res_queue = queue.Queue()
            img_queue = queue.Queue()
            
            def fetch_ai():
                res_queue.put(self.ai_brain.generate(cmd))
            
            def fetch_imgs():
                search_term = cmd
                for w in ["who is", "what is", "where is", "tell me about", "why is", "how to"]:
                    search_term = search_term.replace(w, "")
                img_queue.put(self.ai_brain.get_images(search_term.strip()))
            
            threading.Thread(target=fetch_ai, daemon=True).start()
            threading.Thread(target=fetch_imgs, daemon=True).start()
            
            # Wait for AI text first (usually faster or equal to image search)
            answer, mode = res_queue.get()
            
            # Wait for images (don't block forever, max 3s)
            try:
                images = img_queue.get(timeout=3)
            except:
                images = []
            
            try:
                eel.updateAnswer(answer, images)
                self._ui_update("wake", f"AI ({mode})", "#00e5ff", "")
            except:
                pass
            
            # RESUME LISTENING: Set the mic event so the worker loop continues to the next command
            self._mic_event.set()
            
            clean_ans = self.clean_for_speech(answer)
            threading.Thread(target=lambda r=clean_ans: self._speak_and_resume(r), daemon=True).start()
            return

        # YouTube search
        yt = re.search(r'\b(youtube|you\s*tube)\b\s*(.*)', cmd)
        if yt and yt.group(2).strip():
            q = yt.group(2).strip()
            url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(q)}"
            self.open_url(url)
            response = f"Searching YouTube for {q}."
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # Search
        if "search" in cmd or "google" in cmd:
            q = re.sub(r'\b(search|google)\b\s*','', cmd).strip()
            if q:
                url = f"https://www.google.com/search?q={urllib.parse.quote(q)}"
                self.open_url(url)
                response = f"Searching for {q}."
                self._ui_update("wake", "LISTENING", "#00e5ff", response)
                self._mic_event.set() # Resume listening
                threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
                return

        # Bare site name
        url = self.get_url(cmd)
        if url:
            self.open_url(url)
            response = f"Opening {cmd.title()}."
            self._ui_update("wake", "LISTENING", "#00e5ff", response)
            self._mic_event.set() # Resume listening
            threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()
            return

        # Fallback Google
        url = f"https://www.google.com/search?q={urllib.parse.quote(cmd)}"
        self.open_url(url)
        response = f"I've Googled that for you."
        self._ui_update("wake", "LISTENING", "#00e5ff", response)
        self._mic_event.set() # Resume listening
        threading.Thread(target=lambda r=response: self._speak_and_resume(r), daemon=True).start()

    # ── Activation sequence ───────────────────────
    def _activate(self):
        if self._active: return
        self._active = True
        try:
            winsound.PlaySound("SystemHand", winsound.SND_ALIAS | winsound.SND_ASYNC)
        except: pass
        self._ui_update("wake", "Listening...", "#00e5ff", "How can I help you?")
        threading.Thread(target=lambda: self.speak("How can I help you?"), daemon=True).start()
        self._mic_event.set()

    def _activate_silent(self):
        if self._active: return
        self._active = True
        try: winsound.PlaySound("SystemHand", winsound.SND_ALIAS | winsound.SND_ASYNC)
        except: pass
        self._ui_update("wake", "Processing...", "#00e5ff", "Analyzing command...")
        self._mic_event.set()

    def _deactivate(self):
        if not self._active: return
        self._active = False
        try:
            winsound.PlaySound("SystemExit", winsound.SND_ALIAS | winsound.SND_ASYNC)
        except: pass
        self._ui_update("idle", "Waiting for you to say 'Hello Bro'...", "#9b66d6", "S.O.U.L. is resting")
        self._mic_event.set() # Wake up the worker thread if it's trapped waiting for mic_event

    # ── Background listening thread ───────────────
    def _start_worker(self):
        if self.mic is None:
            self._ui_update("idle", "Microphone not found", "#f28b82", "Mic Error")
            return
        def worker():
            # Initial calibration
            if self.mic:
                try:
                    with self.mic as src:
                        print("Calibrating for background noise...")
                        self.r.adjust_for_ambient_noise(src, duration=1)
                except: pass
            # ✅ FIX: Mark mic as ready AFTER calibration so the UI button works
            self._mic_ready = True
            print("✅ Microphone ready.")
            
            while not self._stop_event.is_set():
                if not self._active:
                    # Passive listening for "Hello Bro"
                    try:
                        if not self.mic: 
                            time.sleep(1)
                            continue
                        with self.mic as src:
                            audio = self.r.listen(src, timeout=5, phrase_time_limit=5)
                        text = self.r.recognize_google(audio).lower().strip()
                        if any(w in text for w in WAKE_WORDS):
                            self._activate()
                    except:
                        continue
                else:
                    # Active: wait for mic_event to start next command
                    self._mic_event.wait(timeout=30)
                    self._mic_event.clear() # IMPORTANT: Clear the event so we don't loop infinitely
                    if not self._active: continue
                    
                    self._ui_update("listening", "Listening for command...", "#f28b82", "Speak your command...")
                    try:
                        with self.mic as src:
                            audio = self.r.listen(src, timeout=10, phrase_time_limit=15)
                        
                        self._ui_update("thinking", "Thinking...", "#fbbc04", "Processing...")
                        cmd = self.r.recognize_google(audio, language="en-US").strip()
                        if cmd:
                            self.handle_command(cmd)
                    except sr.WaitTimeoutError:
                        self._ui_update("idle", "Timeout — Back to sleep", "#9b66d6", "S.O.U.L. is resting")
                        self._deactivate()
                    except sr.UnknownValueError:
                        self._ui_update("wake", "I didn't catch that", "#f28b82", "Could you repeat?")
                        self._deactivate()
                    except Exception:
                        self._deactivate()

        threading.Thread(target=worker, daemon=True).start()

    def run(self):
        self._start_worker()
        # Start Eel server and open the window
        eel.start('index.html', size=(800, 720))

# Create global instance
app = SoulAssistant()

# Expose functions to Javascript
@eel.expose
def manual_activate():
    # ✅ FIX: Wait briefly for mic to become ready instead of silently returning
    if not app._mic_ready:
        for _ in range(20):  # wait up to 2 seconds
            time.sleep(0.1)
            if app._mic_ready:
                break
    if app._active:
        app._deactivate()
    else:
        app._activate()

@eel.expose
def manual_deactivate():
    if app._active:
        app._deactivate()

@eel.expose
def quick_action(cmd):
    if not app._active:
        app._activate_silent()
        time.sleep(0.3)
    app.handle_command(cmd)

@eel.expose
def manual_command(cmd):
    if any(w in cmd.lower() for w in WAKE_WORDS):
        app._activate()
        return
    if not app._active:
        app._activate_silent()  # Auto-activate silently when user types a command
        time.sleep(0.3)
    app.handle_command(cmd)

@eel.expose
def update_setting_py(key, val):
    if key == "voice":
        app.selected_voice = val
        print(f"DEBUG: Voice switched to {val}")
    elif key == "elevenlabs_key":
        app.elevenlabs_key = val.strip()
        print("DEBUG: ElevenLabs API Key updated")

@eel.expose
def get_live_weather(lat=None, lon=None):
    try:
        area, region = "Jalandhar", "Punjab"
        if not lat or not lon:
            try:
                ip_data = requests.get('http://ip-api.com/json', timeout=3).json()
                if ip_data.get('status') == 'success':
                    lat = ip_data.get('lat')
                    lon = ip_data.get('lon')
                    area = ip_data.get('city', 'Jalandhar')
                    region = ip_data.get('regionName', 'Punjab')
            except Exception as ip_e:
                print("IP Geolocation fallback error:", ip_e)
                lat, lon = 31.3256, 75.5792
        else:
            try:
                geo_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
                geo_data = requests.get(geo_url, timeout=3).json()
                area = geo_data.get('city') or geo_data.get('locality') or "Jalandhar"
                region = geo_data.get('principalSubdivision') or "Punjab"
            except Exception:
                pass
        
        # Primary High-Precision Engine: Open-Meteo
        try:
            om_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code"
            om_data = requests.get(om_url, timeout=4).json()
            cur = om_data['current']
            temp_c = round(cur['temperature_2m'])
            code = cur['weather_code']
            
            wmo_map = {
                0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
                45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
                61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 71: "Light Snow", 73: "Snow",
                80: "Rain Showers", 81: "Heavy Showers", 95: "Thunderstorm", 96: "Severe Storm"
            }
            desc = wmo_map.get(code, "Clear")
            
            hour = time.localtime().tm_hour
            is_night = hour < 6 or hour >= 19
            
            emoji = "🌙" if is_night else "☀️"
            d_lower = desc.lower()
            if "cloud" in d_lower or "overcast" in d_lower: emoji = "☁️"
            elif "rain" in d_lower or "shower" in d_lower or "drizzle" in d_lower: emoji = "🌧️"
            elif "thunder" in d_lower or "storm" in d_lower: emoji = "⛈️"
            elif "snow" in d_lower or "ice" in d_lower: emoji = "❄️"
            elif "fog" in d_lower or "mist" in d_lower: emoji = "🌫️"
            elif "clear" in d_lower or "sun" in d_lower: emoji = "🌙" if is_night else "☀️"
            
            return {"location": f"{area}, {region}", "temp": f"{temp_c}°C", "desc": desc, "emoji": emoji}
        except Exception as om_e:
            print("Open-Meteo fallback to wttr.in due to:", om_e)
            url = f"https://wttr.in/~{lat},{lon}?format=j1" if lat and lon else "https://wttr.in/?format=j1"
            res = requests.get(url, timeout=5).json()
            cur = res['current_condition'][0]
            loc = res['nearest_area'][0]
            area = loc['areaName'][0]['value']
            region = loc['region'][0]['value']
            temp = cur['temp_C']
            desc = cur['weatherDesc'][0]['value']
            
            hour = time.localtime().tm_hour
            is_night = hour < 6 or hour >= 19
            
            emoji = "🌙" if is_night else "☀️"
            d_lower = desc.lower()
            if "cloud" in d_lower or "overcast" in d_lower: emoji = "☁️"
            elif "rain" in d_lower or "shower" in d_lower or "drizzle" in d_lower: emoji = "🌧️"
            elif "thunder" in d_lower or "storm" in d_lower: emoji = "⛈️"
            elif "snow" in d_lower or "ice" in d_lower: emoji = "❄️"
            elif "fog" in d_lower or "mist" in d_lower: emoji = "🌫️"
            elif "clear" in d_lower or "sun" in d_lower: emoji = "🌙" if is_night else "☀️"
            return {"location": f"{area}, {region}", "temp": f"{temp}°C", "desc": desc, "emoji": emoji}
            
    except Exception as e:
        print("Live weather error:", e)
        return {"location": "Jalandhar, Punjab", "temp": "24°C", "desc": "Clear", "emoji": "🌙"}

if __name__ == "__main__":
    app.run()
