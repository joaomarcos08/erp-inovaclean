const { Pool } = require('pg');
require('dotenv').config();

// Remoção definitiva de configurações de localhost (Usaremos 100% o NeonDB para Desenvolvimento e Produção)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let poolConfig = {};

if (connectionString) {
  poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10,
    connectionTimeoutMillis: 15000,
  };
} else if (process.env.PGHOST) {
  console.log("Variáveis nativas Múltiplas do NeonDB detectadas. Inicializando Pool Severless...");
  poolConfig = {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10,
    connectionTimeoutMillis: 15000,
  };
} else {
  console.error("ERRO CRÍTICO: Nenhuma variável de conexão com o Banco Neon foi encontrada no .env (Nem POSTGRES_URL nem PGHOST)");
  process.exit(1);
}

const pool = new Pool(poolConfig);

// Tratamento passivo de erros de conexão (NÃO DESLIGAR O SERVERLESS)
pool.on('error', (err) => {
  console.error('⚠️ Aviso: Oscilação no pool de conexão PostgreSQL:', err.message);
  // Não fazemos process.exit(-1) pois functions na Vercel não podem se suicidar
});

module.exports = pool;