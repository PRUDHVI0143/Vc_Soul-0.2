function updateState(state, status, color, main) {
    if (window.reactUpdateState) {
        window.reactUpdateState(state, status, color, main);
    }
}
eel.expose(updateState);
