const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // <--- Proteção de cabeçalhos (XSS e Sniffing)
const { apiLimiter } = require('./middleware/rateLimiter'); // <--- Prevenção anti-DDOS 
require('dotenv').config();

const app = express();

// Configurações Globais de Segurança e Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"], // <-- Permite os atributos onclick="" nos botões HTML
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"], // <-- Permite os CDNs fazerem fetch() internos
    },
  },
}));
app.use(apiLimiter); // Todas as requisições normais passarão pelo filtro de no máximo 100/min

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve seu index.html automaticamente

// Importação das Rotas
const authRoutes = require('./routes/auth');
const produtoRoutes = require('./routes/produtos');
const clienteRoutes = require('./routes/clientes');
const vendaRoutes = require('./routes/vendas');
const dashboardRoutes = require('./routes/dashboard');
const relatorioRoutes = require('./routes/relatorios');
const usuarioRoutes = require('./routes/usuarios');
const financeiroRoutes = require('./routes/financeiro');
const orcamentoRoutes = require('./routes/orcamentos');
const fornecedoresRoutes = require('./routes/fornecedores');

// Uso das Rotas (Prefixos)
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 ERP InovaClean Rodando em Bacabal na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});