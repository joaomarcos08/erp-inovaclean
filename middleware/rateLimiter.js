const rateLimit = require('express-rate-limit');

// Bloquear ataques de Força Bruta no Endpoint de Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Maximo de 10 tentativas para o memo IP por janela
    message: {
        success: false,
        message: 'Muitas tentativas de login excedidas a partir deste IP. Tente novamente após 15 minutos pelo bem da segurança do ERP.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limite Geral para APIs (Previne ataques de negação de API DDOS)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 100 requisições normais de navegação
    message: {
        success: false,
        message: 'Tráfego excessivo detectado no seu IP. Por favor, aguarde antes de tentar novas ações.'
    }
});

module.exports = {
    loginLimiter,
    apiLimiter
};
