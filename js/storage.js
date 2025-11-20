// Preferencias y almacenamiento local
const KEY_PREFS = 'prefs';
const KEY_LOGS = 'audit_logs';

function getPrefs() { return JSON.parse(localStorage.getItem(KEY_PREFS) || '{}'); }
function setPrefs(p) { localStorage.setItem(KEY_PREFS, JSON.stringify(p)); }

function pushLog(entry) {
    const logs = JSON.parse(localStorage.getItem(KEY_LOGS) || '[]');
    logs.push({ ...entry, ts: new Date().toISOString() });
    localStorage.setItem(KEY_LOGS, JSON.stringify(logs));
}
function getLogs() { return JSON.parse(localStorage.getItem(KEY_LOGS) || '[]'); }

window.store = { getPrefs, setPrefs, pushLog, getLogs };