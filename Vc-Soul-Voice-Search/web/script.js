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
        resetDisplay();
        orb.classList.remove("active");
    } else {
        orb.classList.add("active");
        if (state === "listening") orb.classList.add("listening");
        if (state === "thinking") orb.classList.add("thinking");
    }
}

eel.expose(updateAnswer);
function updateAnswer(text, images) {
    const orb = document.getElementById("orb-container");
    const mainText = document.getElementById("main-text");
    const aiContainer = document.getElementById("ai-response-container");
    const aiText = document.getElementById("ai-text");
    const aiImages = document.getElementById("ai-images");

    // Hide orb and main text
    orb.style.display = "none";
    mainText.style.display = "none";
    
    // Show AI Display
    aiContainer.style.display = "block";
    aiText.innerText = text;
    
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
        color: 0x8a2be2, // Purple dots/lines to match aesthetic
        backgroundColor: 0x0a0a0c, // Deep dark background
        points: 12.00,
        maxDistance: 22.00,
        spacing: 18.00
    });
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
}

function toggleLightDarkMode(mode) {
    if (mode === 'light') {
        document.body.classList.add('light-mode');
        if (window.VANTA && window.VANTA.current) {
            window.VANTA.current.setOptions({
                backgroundColor: 0xf0f2f5,
                color: 0x6366f1
            });
        }
    } else {
        document.body.classList.remove('light-mode');
        if (window.VANTA && window.VANTA.current) {
            window.VANTA.current.setOptions({
                backgroundColor: 0x0a0a0c,
                color: 0x8a2be2
            });
        }
    }
}
