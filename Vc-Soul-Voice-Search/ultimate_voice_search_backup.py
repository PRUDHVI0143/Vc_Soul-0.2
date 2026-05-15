#!/usr/bin/env python3
"""
🔍 ULTIMATE Vc Soul - Voice Control EVERYTHING!
Say: "search python tutorial" or "open Netflix" or "Google Tesla"
"""
import sys
import subprocess
import platform
import tkinter as tk
from tkinter import scrolledtext
import threading
import urllib.parse
import speech_recognition as sr
import pyttsx3
import re

class UltimateVcSoul:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🤖 ULTIMATE Vc Soul - Voice Control")
        self.root.geometry("600x500")
        self.root.configure(bg='#0f0f23')
        self.setup_voice()
        self.setup_ui()
        self.status_var = tk.StringVar(value="👂 Ready - Say 'search [topic]' or 'open [site]'")
        self.listen_thread()
    
    def setup_voice(self):
        self.r = sr.Recognizer()
        self.mic = sr.Microphone()
        self.tts = pyttsx3.init()
        self.tts.setProperty('rate', 180)
    
    def setup_ui(self):
        tk.Label(self.root, text="🤖 ULTIMATE Vc Soul", font=('Arial', 24, 'bold'), 
                fg='#00d4ff', bg='#0f0f23').pack(pady=20)
        
        tk.Label(self.root, textvariable=self.status_var, font=('Arial', 12), 
                fg='#00ff88', bg='#0f0f23').pack(pady=5)
        
        tk.Label(self.root, text="📝 Command History:", font=('Arial', 10, 'bold'), 
                fg='#888', bg='#0f0f23').pack(anchor='w', padx=20, pady=(20,5))
        
        self.log = scrolledtext.ScrolledText(self.root, height=10, bg='#1a1a2e', fg='#00ff88', 
                                           font=('Consolas', 10), relief='flat')
        self.log.pack(pady=10, padx=20, fill='both', expand=True)
        
        entry_frame = tk.Frame(self.root, bg='#0f0f23')
        entry_frame.pack(pady=10, padx=20, fill='x')
        
        self.entry = tk.Entry(entry_frame, font=('Arial', 12), relief='flat', bg='#1a1a2e', fg='white')
        self.entry.pack(side='left', fill='x', expand=True)
        self.entry.bind('<Return>', lambda e: self.manual_command())
        
        tk.Button(entry_frame, text="🚀 EXECUTE", font=('Arial', 12, 'bold'), bg='#ff6b35', 
                 fg='white', relief='flat', command=self.manual_command).pack(side='right', padx=(10,0))
    
    def speak(self, text):
        try:
            self.tts.say(text)
            self.tts.runAndWait()
        except:
            pass
    
    def log_command(self, command, url, action="Opened"):
        self.log.insert(tk.END, f"✅ {action}: '{command}' → {url}\n")
        self.log.see(tk.END)
    
    def launch_brave(self, url):
        try:
            system = platform.system()
            if system == "Darwin":  # macOS
                subprocess.run(["open", "-a", "Brave Browser", url], check=True)
            elif system == "Windows":
                subprocess.run(f'start brave "{url}"', shell=True, check=True)
            else:  # Linux
                subprocess.run(["brave-browser", url], check=True)
            return True
        except:
            try:
                import webbrowser
                webbrowser.open(url)
                return True
            except:
                return False
    
    def get_site_url(self, site_name):
        """Map site names to URLs"""
        sites = {
            # Streaming
            "netflix": "https://www.netflix.com",
            "netfilx": "https://www.netflix.com",
            "youtube": "https://www.youtube.com",
            "you tube": "https://www.youtube.com",
            "netfile": "https://www.netflix.com",
            "hulu": "https://www.hulu.com",
            "disney": "https://www.disneyplus.com",
            "prime video": "https://www.primevideo.com",
            "amazon prime": "https://www.primevideo.com",
            # Social
            "instagram": "https://www.instagram.com",
            "twitter": "https://twitter.com",
            "facebook": "https://www.facebook.com",
            "tiktok": "https://www.tiktok.com",
            "reddit": "https://www.reddit.com",
            # Shopping
            "amazon": "https://www.amazon.com",
            "ebay": "https://www.ebay.com",
            # Search
            "google": "https://www.google.com",
            "bing": "https://www.bing.com",
            # Other
            "github": "https://github.com",
            "stackoverflow": "https://stackoverflow.com",
            "wikipedia": "https://www.wikipedia.org"
        }
        return sites.get(site_name.lower())
    
    def handle_command(self, command):
        command = command.lower().strip()
        self.status_var.set(f"📢 Processing: {command[:40]}...")
        
        # Direct site open via keywords (simple split)
        parts = command.split()
        if parts and parts[0] in ["open", "go", "launch", "visit"] and len(parts) > 1:
            site = parts[1]
            url = self.get_site_url(site)
            if url:
                self.launch_brave(url)
                self.speak(f"Opening {site}")
                self.log_command(site, url)
                return
        
        # YouTube search (no direct open)
        if re.search(r'\b(?:youtube|you tube)\b', command):
            # Extract query after youtube keyword
            query = command.replace("youtube", "").replace("you tube", "").strip()
            if query:
                encoded = urllib.parse.quote(query)
                url = f"https://www.youtube.com/results?search_query={encoded}"
                self.launch_brave(url)
                self.speak(f"Searching YouTube for {query}")
                self.log_command(f"YouTube: {query}", url)
                return
            # No action for plain "open youtube" – will be handled by direct site open above

        # Google search (default)
        if "search" in command or "google" in command:
            query = command.replace("search", "").replace("google", "").strip()
            if query:
                encoded = urllib.parse.quote(query)
                url = f"https://www.google.com/search?q={encoded}"
                self.launch_brave(url)
                self.speak(f"Searching for {query}")
                self.log_command(query, url)
                return
        
        # Fallback direct site name
        url = self.get_site_url(command)
        if url:
            self.launch_brave(url)
            self.speak(f"Opening {command}")
            self.log_command(command, url)
            return
        
        # Ultimate fallback - Google it
        encoded = urllib.parse.quote(command)
        url = f"https://www.google.com/search?q={encoded}"
        self.launch_brave(url)
        self.speak(f"Searching Google for {command}")
        self.log_command(command, url, "Googled")
    
    def listen_thread(self):
        def loop():
            try:
                with self.mic as source:
                    self.r.adjust_for_ambient_noise(source, duration=0.5)
                while True:
                    try:
                        self.status_var.set("🎤 Listening...")
                        with self.mic as source:
                            audio = self.r.listen(source, timeout=1, phrase_time_limit=5)
                        command = self.r.recognize_google(audio)
                        self.root.after(0, lambda: self.handle_command(command))
                    except sr.WaitTimeoutError:
                        pass
                    except sr.UnknownValueError:
                        pass
                    except sr.RequestError:
                        self.status_var.set("❌ Speech service error")
            except Exception as e:
                self.status_var.set("❌ Mic error - Use manual input")
        threading.Thread(target=loop, daemon=True).start()
    
    def manual_command(self):
        command = self.entry.get().strip()
        if command:
            self.handle_command(command)
            self.entry.delete(0, tk.END)
    
    def run(self):
        self.speak("Ultimate Vc Soul activated! Say 'open Netflix' or 'search quantum physics'")
        self.root.mainloop()

if __name__ == "__main__":
    app = UltimateVcSoul()
    app.run()
