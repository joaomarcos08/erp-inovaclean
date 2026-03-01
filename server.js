const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configurações Globais
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

// Uso das Rotas (Prefixos)
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatorioRoutes);

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