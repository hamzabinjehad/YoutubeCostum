/* The container app. Kept to the contract the generated ViewController calls:
   show(platform, enabled, useSettingsInsteadOfPreferences). */
function show(platform, enabled, useSettingsInsteadOfPreferences) {
    document.body.classList.add('platform-' + platform);

    if (useSettingsInsteadOfPreferences) {
        var open = document.querySelector('.platform-mac.open-preferences');
        if (open) { open.innerText = 'Open Safari Settings…'; }
    }

    if (typeof enabled === 'boolean') {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

/* Both platforms send the same message; the view controller decides what
   "preferences" means. On iOS this used to be wired on macOS only, so the one
   button the iOS screen offered did nothing at all. */
Array.prototype.forEach.call(document.querySelectorAll('button.open-preferences'), function (button) {
    button.addEventListener('click', function () {
        webkit.messageHandlers.controller.postMessage('open-preferences');
    });
});


/* Called from the app when Safari refuses to open its settings. Without this
   the button was a dead end: it reported nothing and left the same screen up. */
function showError(message) {
    const box = document.querySelector('.state') || document.body;
    const note = document.createElement('p');
    note.className = 'error';
    note.textContent = message;
    box.appendChild(note);
}
