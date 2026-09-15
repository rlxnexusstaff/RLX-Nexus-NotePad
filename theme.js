import { DOM } from './dom.js';

export function initTheme() {
    const STORAGE_KEY = 'rlx_nexus_theme';
    const btnToggle = document.getElementById('btn-theme-toggle');

    // 1. Verifica se já há uma preferência salva ou usa a do sistema
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    applyTheme(currentTheme);

    // 2. Evento de clique no botão
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
            
            applyTheme(newTheme);
            localStorage.setItem(STORAGE_KEY, newTheme);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const btnToggle = document.getElementById('btn-theme-toggle');
    
    if (btnToggle) {
        btnToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        btnToggle.setAttribute('title', theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro');
    }
}