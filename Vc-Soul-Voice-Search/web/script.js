// Connect Python state to JS
eel.expose(updateState);
function updateState(state, statusText, dotColor, mainText) {
    const orb = document.getElementById("orb-container");
    const dot = document.getElementById("status-dot");
    const stext = document.getElementById("status-text");
    const mtext = document.getElementById("main-text");

    // Update texts
    if (statusText) stext.innerText = statusText;
    if (mainText) mtext.innerText = mainText;
    if (dotColor) dot.style.backgroundColor = dotColor;

    // Reset orb classes
    orb.className = "orb-container";

    // Only reset the display back to the orb when going to sleep (idle)
    if (state === "idle") {
        orb.classList.remove("active");
    } else {
        orb.classList.add("active");
        if (state === "listening") orb.classList.add("listening");
        if (state === "thinking") orb.classList.add("thinking");
    }
}

eel.expose(updateAnswer);
function updateAnswer(text, images, question) {
    const orb = document.getElementById("orb-container");
    const mainText = document.getElementById("main-text");
    const aiContainer = document.getElementById("ai-response-container");
    const aiText = document.getElementById("ai-text");
    const aiImages = document.getElementById("ai-images");
    const aiQuestion = document.getElementById("ai-question-text");
    const aiQuestionBox = document.getElementById("ai-question-box");

    // Hide orb and main text
    orb.style.display = "none";
    mainText.style.display = "none";
    
    // Show AI Display
    aiContainer.style.display = "block";
    aiText.innerText = text;
    
    // Show Question if available
    if (aiQuestion && aiQuestionBox) {
        if (question) {
            aiQuestionBox.style.display = "block";
            aiQuestion.innerText = question;
        } else {
            aiQuestionBox.style.display = "none";
        }
    }
    
    // Process Images
    aiImages.innerHTML = "";
    if (images && images.length > 0) {
        images.forEach(src => {
            let img = document.createElement("img");
            img.src = src;
            aiImages.appendChild(img);
        });
    }
}

eel.expose(resetDisplay);
function resetDisplay() {
    const orb = document.getElementById("orb-container");
    const mainText = document.getElementById("main-text");
    const aiContainer = document.getElementById("ai-response-container");

    if (aiContainer) {
        orb.style.display = "flex";
        mainText.style.display = "block";
        aiContainer.style.display = "none";
    }
}

function dismissAnswer() {
    resetDisplay();
    if (window.eel && window.eel.manual_deactivate) {
        eel.manual_deactivate()();
    }
}

function refreshAssistant() {
    console.log("Refreshing assistant state...");
    resetDisplay();
    if (window.eel && window.eel.manual_deactivate) {
        eel.manual_deactivate()();
    }
    if (typeof initWeather === 'function') initWeather();
    alert("S.O.U.L. has been fully refreshed and reset to idle state!");
}

// User Actions -> Call Python
function manualActivate() {
    eel.manual_activate()();
}

function quickAction(cmd) {
    eel.quick_action(cmd)();
}

document.getElementById('command-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        let val = this.value.trim();
        if (val) {
            eel.manual_command(val)();
            this.value = "";
        }
    }
});

// Setup Initial state on load
function initClock() {
    function update() {
        const now = new Date();
        const timeEl = document.getElementById("live-time");
        const dateEl = document.getElementById("live-date");
        if (timeEl) timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        if (dateEl) dateEl.innerText = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    update();
    setInterval(update, 1000);
}

function initWeather() {
    async function fetchW(lat = null, lon = null) {
        if (window.eel && window.eel.get_live_weather) {
            try {
                let res = await eel.get_live_weather(lat, lon)();
                if (res) {
                    document.getElementById("weather-loc").innerText = res.location;
                    document.getElementById("weather-temp").innerText = res.temp;
                    document.getElementById("weather-desc").innerText = res.desc;
                    document.getElementById("weather-emoji").innerText = res.emoji;

                    // Populate Weather Modal fields
                    if (document.getElementById("weather-modal-emoji")) document.getElementById("weather-modal-emoji").innerText = res.emoji;
                    if (document.getElementById("weather-modal-temp")) document.getElementById("weather-modal-temp").innerText = res.temp;
                    if (document.getElementById("weather-modal-desc")) document.getElementById("weather-modal-desc").innerText = res.desc;
                    if (document.getElementById("weather-modal-rf")) document.getElementById("weather-modal-rf").innerText = res.feels_like || res.temp;
                    if (document.getElementById("weather-modal-rfs")) document.getElementById("weather-modal-rfs").innerText = res.feels_like_shade || res.feels_like || res.temp;
                    if (document.getElementById("weather-modal-uv")) document.getElementById("weather-modal-uv").innerText = res.uv_index || "0.8 (Low)";
                    if (document.getElementById("weather-modal-dp")) document.getElementById("weather-modal-dp").innerText = res.dew_point || "15°C";
                    if (document.getElementById("weather-modal-wind")) document.getElementById("weather-modal-wind").innerText = res.wind_speed || "NNE 9 km/h";
                    if (document.getElementById("weather-modal-pres")) document.getElementById("weather-modal-pres").innerText = res.pressure || "↑ 1003 mb";
                    if (document.getElementById("weather-modal-gusts")) document.getElementById("weather-modal-gusts").innerText = res.wind_gusts || "23 km/h";
                    if (document.getElementById("weather-modal-cloud")) document.getElementById("weather-modal-cloud").innerText = res.cloud_cover || "0%";
                    if (document.getElementById("weather-modal-hum")) document.getElementById("weather-modal-hum").innerText = res.humidity || "56%";
                    if (document.getElementById("weather-modal-vis")) document.getElementById("weather-modal-vis").innerText = res.visibility || "8 km";
                    if (document.getElementById("weather-modal-ihum")) document.getElementById("weather-modal-ihum").innerText = res.indoor_humidity || "56% (Slightly Humid)";
                    if (document.getElementById("weather-modal-ceil")) document.getElementById("weather-modal-ceil").innerText = res.cloud_ceiling || "9100 m";
                }
            } catch(e) { console.error("Weather error", e); }
        }
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchW(pos.coords.latitude, pos.coords.longitude),
            (err) => fetchW(null, null)
        );
    } else {
        fetchW(null, null);
    }
    setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchW(pos.coords.latitude, pos.coords.longitude),
                (err) => fetchW(null, null)
            );
        } else {
            fetchW(null, null);
        }
    }, 600000); // 10 mins
}

window.onload = () => {
    initClock();
    initWeather();
    VANTA.NET({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xf4f4f4,        // Silver/White lines
        backgroundColor: 0x000000, // Pure black background
        points: 12.00,
        maxDistance: 22.00,
        spacing: 18.00
    });
    setTimeout(loadInitialState, 1000);
};


// Settings Modal & Control Functions
function toggleSettingsModal() {
    const modal = document.getElementById("settings-modal");
    if (modal) {
        modal.style.display = modal.style.display === "none" ? "flex" : "none";
    }
}

function updateTheme(theme) {
    let colorMap = {
        violet: 0x8a2be2,
        cyan: 0x00e5ff,
        emerald: 0x10b981,
        crimson: 0xf43f5e
    };
    if (window.VANTA && window.VANTA.current) {
        window.VANTA.current.setOptions({
            color: colorMap[theme] || 0x8a2be2
        });
    }
    if (theme === 'cyan') {
        document.documentElement.style.setProperty('--purple', '#00e5ff');
    } else if (theme === 'emerald') {
        document.documentElement.style.setProperty('--purple', '#10b981');
    } else if (theme === 'crimson') {
        document.documentElement.style.setProperty('--purple', '#f43f5e');
    } else {
        document.documentElement.style.setProperty('--purple', '#8a2be2');
    }
}

function toggleWakeWord() {
    const statusEl = document.getElementById("wake-word-status");
    if (statusEl) {
        if (statusEl.innerText === "ACTIVE") {
            statusEl.innerText = "MUTED";
            statusEl.style.color = "#ef4444";
            statusEl.parentElement.style.background = "rgba(239, 68, 68, 0.2)";
            statusEl.parentElement.style.borderColor = "rgba(239, 68, 68, 0.4)";
        } else {
            statusEl.innerText = "ACTIVE";
            statusEl.style.color = "#22c55e";
            statusEl.parentElement.style.background = "rgba(34, 197, 94, 0.2)";
            statusEl.parentElement.style.borderColor = "rgba(34, 197, 94, 0.4)";
        }
    }
}

function updateSetting(key, val) {
    console.log(`Setting updated: ${key} = ${val}`);
    if (window.eel && window.eel.update_setting_py) {
        eel.update_setting_py(key, val)();
    }
}

function saveCustomWakeWord() {
    const input = document.getElementById("setting-custom-wake");
    if (input && input.value.trim()) {
        const val = input.value.trim().toLowerCase();
        console.log(`Custom wake word saved: ${val}`);
        if (window.eel && window.eel.update_setting_py) {
            eel.update_setting_py('custom_wake_word', val)();
        }
        alert(`Wake word updated to '${val}'. S.O.U.L. is now actively listening for it!`);
        input.value = "";
    }
}

function toggleLightDarkMode(mode) {
    if (mode === 'light') {
        document.body.classList.add('light-mode');
        if (window.VANTA && window.VANTA.current) {
            window.VANTA.current.setOptions({
                backgroundColor: 0xffffff, // Pure white background
                color: 0x111111 // Dark charcoal lines
            });
        }
    } else {
        document.body.classList.remove('light-mode');
        if (window.VANTA && window.VANTA.current) {
            window.VANTA.current.setOptions({
                backgroundColor: 0x000000, // Pure black background
                color: 0xf4f4f4 // Silver/White lines
            });
        }
    }
}

function toggleHistoryModal() {
    const modal = document.getElementById("history-modal");
    if (modal) {
        if (modal.style.display === "none") {
            modal.style.display = "flex";
            loadSearchHistory();
        } else {
            modal.style.display = "none";
        }
    }
}

async function loadSearchHistory() {
    const listEl = document.getElementById("history-list");
    if (listEl && window.eel && window.eel.get_search_history) {
        try {
            let history = await eel.get_search_history()();
            listEl.innerHTML = "";
            if (!history || history.length === 0) {
                listEl.innerHTML = `<p style="color: #888; font-size: 14px; text-align: center; margin-top: 20px;">No search history found.</p>`;
                return;
            }
            history.forEach(item => {
                let div = document.createElement("div");
                div.style.background = "rgba(0,0,0,0.4)";
                div.style.border = "1px solid rgba(0, 229, 255, 0.2)";
                div.style.padding = "10px 14px";
                div.style.borderRadius = "10px";
                div.style.display = "flex";
                div.style.flexDirection = "column";
                div.style.gap = "4px";
                
                let header = document.createElement("div");
                header.style.display = "flex";
                header.style.justifyContent = "space-between";
                header.style.fontSize = "11px";
                header.style.color = "#888";
                header.innerHTML = `<span>🏷️ ${item.type}</span><span>🕒 ${item.time}</span>`;
                
                let query = document.createElement("div");
                query.style.fontSize = "13px";
                query.style.color = "#fff";
                query.style.fontWeight = "600";
                query.innerText = item.query;
                
                div.appendChild(header);
                div.appendChild(query);
                listEl.appendChild(div);
            });
        } catch(e) { console.error("History load error", e); }
    }
}

async function clearSearchHistory() {
    if (window.eel && window.eel.clear_search_history) {
        await eel.clear_search_history()();
        const listEl = document.getElementById("history-list");
        if (listEl) {
            listEl.innerHTML = `<p style="color: #888; font-size: 14px; text-align: center; margin-top: 20px;">Search history cleared.</p>`;
        }
        alert("Search history has been permanently cleared!");
    }
}

async function loadInitialState() {
    if (window.eel && window.eel.get_initial_settings) {
        try {
            let settings = await eel.get_initial_settings()();
            if (settings) {
                if (settings.appearance) {
                    document.getElementById("setting-appearance").value = settings.appearance;
                    toggleLightDarkMode(settings.appearance);
                }
                if (settings.voice) {
                    document.getElementById("setting-voice").value = settings.voice;
                }
                if (settings.elevenlabs_key) {
                    document.getElementById("setting-eleven-key").value = settings.elevenlabs_key;
                }
                if (settings.ai_mode) {
                    document.getElementById("setting-ai-mode").value = settings.ai_mode;
                }
                if (settings.theme) {
                    document.getElementById("setting-theme").value = settings.theme;
                    updateTheme(settings.theme);
                }
            }
        } catch(e) { console.error("Settings load error", e); }
    }
}

function toggleWeatherModal() {
    const modal = document.getElementById("weather-modal");
    if (modal) {
        if (modal.style.display === "none") {
            const timeEl = document.getElementById("weather-modal-time");
            if (timeEl) timeEl.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            modal.style.display = "flex";
        } else {
            modal.style.display = "none";
        }
    }
}
