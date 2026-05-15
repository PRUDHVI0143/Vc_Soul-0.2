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
window.onload = () => {
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
