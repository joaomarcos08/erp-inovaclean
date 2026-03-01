const pool = require('./db');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE vendas ADD COLUMN IF NOT EXISTS vendedor_id INTEGER;
            -- Ignorando FK se a tabela usuarios não foi recriada de forma tradicional, mas adicionamos a FK abaixo:
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'vendas_vendedor_id_fkey'
                ) THEN
                    ALTER TABLE vendas ADD CONSTRAINT vendas_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES usuarios(id);
                END IF;
            END $$;
            
            ALTER TABLE vendas ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);
            ALTER TABLE vendas ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Concluída';
            ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS conta_origem VARCHAR(100);
        `);
        console.log('Migracao concluida com sucesso.');
    } catch (err) {
        console.error('Erro na migracao:', err);
    } finally {
        process.exit();
    }
}
migrate();
