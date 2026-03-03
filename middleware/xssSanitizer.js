const xss = require('xss');

/**
 * Middleware Global de Sanitização (Prevenção contra Cross-Site Scripting)
 * Ele varre recursivamente todo body, query params e URL params limpando tags maliciosas.
 */
function sanitizePayload(payload) {
    if (typeof payload === 'string') {
        // Aplica o filtro XSS para limpar tags como <script>, javascript: etc mantendo o resto do texto
        return xss(payload);
    }
    if (Array.isArray(payload)) {
        return payload.map(item => sanitizePayload(item));
    }
    if (typeof payload === 'object' && payload !== null) {
        const sanitizedObject = {};
        for (const key in payload) {
            sanitizedObject[key] = sanitizePayload(payload[key]);
        }
        return sanitizedObject;
    }
    return payload; // Retorna Int, Boolean, etc no estado original
}

const xssSanitizer = (req, res, next) => {
    if (req.body) req.body = sanitizePayload(req.body);
    if (req.query) req.query = sanitizePayload(req.query);
    if (req.params) req.params = sanitizePayload(req.params);
    next();
};

module.exports = xssSanitizer;
