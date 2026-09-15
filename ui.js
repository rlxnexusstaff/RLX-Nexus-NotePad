import { DOM } from './dom.js';
import { CONFIG } from './config.js';

// ========== GERENCIAMENTO DE TEMA (DARK / LIGHT) ==========
export function initTheme() {
    const savedTheme = localStorage.getItem('rlx_nexus_theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('rlx_nexus_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (DOM.themeIcon) {
        DOM.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// ========== SISTEMA DE ALERTAS (TOAST / CAIXA DE MENSAGEM) ==========
export function showAlert(message, type = 'success') {
    if (!DOM.alertBox) return;

    DOM.alertBox.textContent = message;
    DOM.alertBox.className = `alert alert-${type} alert-enter shadow-sm mt-3`;
    DOM.alertBox.style.display = 'block';

    setTimeout(() => {
        DOM.alertBox.style.display = 'none';
    }, 4000);
}

// ========== STATUS DE AUTO-SAVE ==========
export function setAutoSaveStatus(status) {
    if (!DOM.saveStatus) return;

    DOM.saveStatus.className = 'autosave-status';

    if (status === 'saving') {
        DOM.saveStatus.textContent = 'Salvando alteração...';
        DOM.saveStatus.classList.add('saving');
    } else if (status === 'saved') {
        DOM.saveStatus.textContent = 'Alterações salvas no link!';
        DOM.saveStatus.classList.add('saved');
    } else if (status === 'warning') {
        DOM.saveStatus.textContent = 'Aviso: Link muito longo!';
        DOM.saveStatus.classList.add('char-warning');
    } else {
        DOM.saveStatus.textContent = '';
    }
}

export function setUnsavedState(isUnsaved) {
    if (DOM.btnSave) {
        if (isUnsaved) {
            DOM.btnSave.classList.add('btn-warning');
            DOM.btnSave.classList.remove('btn-primary');
        } else {
            DOM.btnSave.classList.remove('btn-warning');
            DOM.btnSave.classList.add('btn-primary');
        }
    }
}

// ========== CONTADOR DE CARACTERES COM ALERTA VISUAL ==========
export function updateCounters() {
    if (!DOM.textarea || !DOM.charCount) return;

    const currentLength = DOM.textarea.value.length;
    const maxChars = CONFIG.MAX_CHARS || 50000;

    // Atualiza o texto formatado (ex: 1.250 / 50.000 caracteres)
    DOM.charCount.textContent = `${currentLength.toLocaleString('pt-BR')} / ${maxChars.toLocaleString('pt-BR')} caracteres`;

    // Alerta visual caso atinja ou chegue a 90% do limite
    if (currentLength >= maxChars) {
        DOM.charCount.classList.add('char-warning');
        DOM.charCount.textContent = `Limite máximo atingido! (${currentLength.toLocaleString('pt-BR')}/${maxChars.toLocaleString('pt-BR')})`;
    } else if (currentLength >= maxChars * 0.9) {
        DOM.charCount.classList.add('char-warning');
    } else {
        DOM.charCount.classList.remove('char-warning');
    }
}