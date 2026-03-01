const { Pool } = require('pg');
require('dotenv').config();

// Configurações de acesso ao banco
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'erp_distribuidora',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Tratamento de erros de conexão
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexão', err);
  process.exit(-1);
});

module.exports = pool;