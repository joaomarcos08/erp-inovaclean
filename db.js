const { Pool } = require('pg');
require('dotenv').config();

// URL Mágica Injetada pela Vercel/Neon (Contém senha, porta, host e ssl tudo numa linha)
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.POSTGRES_URL;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
    connectionString,
    // Se tiver Serverless / Prod garantimos o reject false (alguns envs falham sem isso)
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'erp_distribuidora',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  };

const pool = new Pool(poolConfig);

// Tratamento passivo de erros de conexão (NÃO DESLIGAR O SERVERLESS)
pool.on('error', (err) => {
  console.error('⚠️ Aviso: Oscilação no pool de conexão PostgreSQL:', err.message);
  // Não fazemos process.exit(-1) pois functions na Vercel não podem se suicidar
});

module.exports = pool;