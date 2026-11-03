const text = chrome.i18n.getMessage;

document.getElementById('versio').textContent = text('versio', chrome.runtime.getManifest().version);
document.getElementById('ajuda').textContent = text('ajuda');
document.getElementById('credit').textContent = text('credit');
