const { Pool } = require('pg');
require('dotenv').config();

// Remoção definitiva de configurações de localhost (Usaremos 100% o NeonDB para Desenvolvimento e Produção)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERRO CRÍTICO: Variável POSTGRES_URL não encontrada no seu .env. Impossível conectar ao Neon!");
  process.exit(1);
}

const poolConfig = {
  connectionString,
  ssl: { rejectUnauthorized: false },
  // Segurança Severless MAX: Vercel detesta portas TCP inativas ocupando espaço
  max: 2,
  idleTimeoutMillis: 10,
  connectionTimeoutMillis: 15000,
};

const pool = new Pool(poolConfig);

// Tratamento passivo de erros de conexão (NÃO DESLIGAR O SERVERLESS)
pool.on('error', (err) => {
  console.error('⚠️ Aviso: Oscilação no pool de conexão PostgreSQL:', err.message);
  // Não fazemos process.exit(-1) pois functions na Vercel não podem se suicidar
});

module.exports = pool;