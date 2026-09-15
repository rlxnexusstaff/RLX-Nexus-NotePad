import { CONFIG } from './config.js';

function sanitizeText(text) {
    return text.replace(/\0/g, '');
}

export function encodeNoteData(title, content) {
    const data = {
        t: sanitizeText(title),
        c: sanitizeText(content),
        v: 1
    };
    try {
        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        if (encoded.length > CONFIG.MAX_URL_LENGTH) {
            return { encoded: null, tooLarge: true };
        }
        return { encoded, tooLarge: false };
    } catch (e) {
        console.error('Erro ao codificar nota:', e);
        return { encoded: null, tooLarge: false };
    }
}

export function decodeNoteData(hash) {
    try {
        const jsonString = decodeURIComponent(atob(hash));
        const data = JSON.parse(jsonString);

        if (typeof data !== 'object' || data === null) return null;

        return {
            t: typeof data.t === 'string' ? data.t.substring(0, CONFIG.MAX_TITLE) : '',
            c: typeof data.c === 'string' ? data.c.substring(0, CONFIG.MAX_CHARS) : '',
            v: data.v || 0
        };
    } catch (e) {
        console.error('Erro ao decodificar nota:', e);
        return null;
    }
}