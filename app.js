import { CONFIG } from './config.js';
import { DOM } from './dom.js';
import { encodeNoteData, decodeNoteData } from './storage.js';
import { showAlert, updateCounters, setAutoSaveStatus, setUnsavedState, initTheme, toggleTheme } from './ui.js';

'use strict';

// ========== AUTO-RESIZE ESTILO DISCORD ==========
function autoResizeTextarea() {
    DOM.textarea.style.height = 'auto';
    DOM.textarea.style.height = DOM.textarea.scrollHeight + 'px';
}

// ========== MODAL DE CONFIRMAÇÃO PERSONALIZADO ==========
function showConfirmModal(title, message, confirmButtonText = 'Confirmar') {
    return new Promise((resolve) => {
        const modalElement = document.getElementById('customConfirmModal');
        const modalTitle = document.getElementById('customConfirmModalLabel');
        const modalBody = document.getElementById('customConfirmModalBody');
        const btnConfirm = document.getElementById('modalBtnConfirm');
        const btnCancel = document.getElementById('modalBtnCancel');

        modalTitle.textContent = title;
        modalBody.textContent = message;
        btnConfirm.textContent = confirmButtonText;

        const bootstrapModal = new bootstrap.Modal(modalElement);

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleDismiss = () => {
            cleanup();
            resolve(false);
        };

        function cleanup() {
            btnConfirm.removeEventListener('click', handleConfirm);
            btnCancel.removeEventListener('click', handleDismiss);
            modalElement.removeEventListener('hidden.bs.modal', handleDismiss);
            bootstrapModal.hide();
        }

        btnConfirm.addEventListener('click', handleConfirm);
        btnCancel.addEventListener('click', handleDismiss);
        modalElement.addEventListener('hidden.bs.modal', handleDismiss, { once: true });

        bootstrapModal.show();
    });
}

// ========== AÇÕES PRINCIPAIS ==========
function saveNoteToUrl() {
    const title = DOM.title.value.trim();
    const content = DOM.textarea.value.trim();

    if (!title && !content) {
        showAlert('A nota está vazia! Escreva algo antes de salvar.', 'warning');
        DOM.textarea.focus();
        return false;
    }

    const { encoded, tooLarge } = encodeNoteData(title, content);

    if (tooLarge) {
        showAlert('Nota muito longa para o compartilhamento via link! O conteúdo excede o limite suportado.', 'warning');
        setAutoSaveStatus('warning');
        return false;
    }

    if (!encoded) return false;

    window.location.hash = encoded;
    setUnsavedState(false);
    showAlert('Nota salva com sucesso! O link foi atualizado na barra de endereços.');
    return true;
}

async function copyShareUrl() {
    if (!saveNoteToUrl()) return;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(window.location.href);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        showAlert('Link copiado para a área de transferência!');
    } catch (err) {
        showAlert('Não foi possível copiar automaticamente. Copie o link da barra de endereços.', 'warning');
    }
}

async function newNote() {
    const hasContent = DOM.title.value.trim() || DOM.textarea.value.trim();

    if (hasContent) {
        const confirmed = await showConfirmModal(
            'Criar Nova Nota', 
            'Deseja criar uma nova nota? O conteúdo atual será perdido.', 
            'Sim, criar'
        );

        if (!confirmed) return;
    }

    history.replaceState(null, '', window.location.pathname + window.location.search);

    DOM.title.value = '';
    DOM.textarea.value = '';
    autoResizeTextarea();
    updateCounters();
    setAutoSaveStatus('');
    setUnsavedState(false);

    if (hasContent) {
        showAlert('Nova nota criada.', 'info');
    }

    DOM.title.focus();
}

function downloadNote() {
    const title = DOM.title.value.trim() || 'nota-sem-titulo';
    const content = DOM.textarea.value;

    if (!content.trim() && !title) {
        showAlert('Nada para baixar! Escreva algo primeiro.', 'warning');
        return;
    }

    const fullContent = `${DOM.title.value}\n${'='.repeat(40)}\n\n${content}`;

    const fileName = title
        .replace(/[^a-zA-Z0-9À-ÿ\s\-_]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
        .toLowerCase() || 'nota';

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    showAlert('Nota baixada com sucesso!');
}

// ========== AUTO-SAVE ==========
let autoSaveTimeout = null;

function triggerAutoSave() {
    autoResizeTextarea();
    updateCounters();
    clearTimeout(autoSaveTimeout);

    const title = DOM.title.value;
    const content = DOM.textarea.value;

    if (!title && !content) {
        setAutoSaveStatus('');
        setUnsavedState(false);
        return;
    }

    setUnsavedState(true);
    setAutoSaveStatus('saving');

    autoSaveTimeout = setTimeout(() => {
        const { encoded, tooLarge } = encodeNoteData(title, content);

        if (tooLarge) {
            setAutoSaveStatus('warning');
            showAlert('Aviso: O texto excedeu o limite máximo para salvamento automático via link.', 'warning');
            return;
        }

        if (encoded) {
            history.replaceState(null, '', '#' + encoded);
            setAutoSaveStatus('saved');
            setUnsavedState(false);
            setTimeout(() => setUnsavedState(false) || setAutoSaveStatus(''), 3000);
        }
    }, CONFIG.AUTO_SAVE_DELAY);
}

// ========== CARREGAR NOTA DA URL (MODO APENAS LEITURA ESTRITO) ==========
function loadNoteFromHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const noteData = decodeNoteData(hash);
    if (noteData) {
        DOM.title.value = noteData.t;
        DOM.textarea.value = noteData.c;
        autoResizeTextarea();
        updateCounters();
        
        // Bloqueia edição
        DOM.title.disabled = true;
        DOM.textarea.readOnly = true;
        DOM.textarea.classList.add('bg-light');
        
        // Oculta botões de ação e ferramentas
        if (DOM.btnSave) DOM.btnSave.style.display = 'none';
        if (DOM.btnNew) DOM.btnNew.style.display = 'none';
        if (DOM.btnDownload) DOM.btnDownload.style.display = 'none';
        if (DOM.btnShare) DOM.btnShare.style.display = 'none';

        showAlert('Você está visualizando uma nota compartilhada (Modo de Apenas Leitura).', 'info');
        
        setUnsavedState(false);
    } else {
        showAlert('Não foi possível carregar a nota do link. O código pode estar corrompido.', 'warning');
    }
}

// ========== ATALHOS DE TECLADO ==========
function handleKeyboardShortcuts(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNoteToUrl();
    }

    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newNote();
    }

    if (e.key === 'Tab' && e.target === DOM.textarea) {
        e.preventDefault();
        const start = DOM.textarea.selectionStart;
        const end = DOM.textarea.selectionEnd;
        DOM.textarea.value =
            DOM.textarea.value.substring(0, start) +
            '    ' +
            DOM.textarea.value.substring(end);
        DOM.textarea.selectionStart = DOM.textarea.selectionEnd = start + 4;
        triggerAutoSave();
    }
}

// ========== PROTEÇÃO CONTRA PERDA DE DADOS ==========
function handleBeforeUnload(e) {
    const hasContent = DOM.title.value.trim() || DOM.textarea.value.trim();
    const hash = window.location.hash.substring(1);

    if (hasContent && !hash) {
        e.preventDefault();
        e.returnValue = '';
    }
}

// ========== EVENT LISTENERS ==========
function init() {
    initTheme();
    autoResizeTextarea();

    if (DOM.btnThemeToggle) {
        DOM.btnThemeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }

    updateCounters();

    DOM.textarea.addEventListener('input', triggerAutoSave);
    DOM.title.addEventListener('input', triggerAutoSave);

    DOM.textarea.addEventListener('input', () => {
        const maxChars = CONFIG.MAX_CHARS || 50000;
        if (DOM.textarea.value.length > maxChars) {
            DOM.textarea.value = DOM.textarea.value.substring(0, maxChars);
            showAlert(`Limite de ${maxChars.toLocaleString('pt-BR')} caracteres atingido!`, 'warning');
            updateCounters();
        }
    });

    DOM.form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveNoteToUrl();
    });

    DOM.btnNew.addEventListener('click', (e) => {
        e.preventDefault();
        newNote();
    });

    DOM.btnShare.addEventListener('click', (e) => {
        e.preventDefault();
        copyShareUrl();
    });

    DOM.btnDownload.addEventListener('click', (e) => {
        e.preventDefault();
        downloadNote();
    });

    document.addEventListener('keydown', handleKeyboardShortcuts);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('hashchange', loadNoteFromHash);

    loadNoteFromHash();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
