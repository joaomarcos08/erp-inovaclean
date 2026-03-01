const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');

router.get('/lucro-mensal', verificarJWT, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COALESCE(SUM((iv.preco_unitario - p.preco_custo) * iv.quantidade), 0) AS lucro
            FROM itens_venda iv JOIN produtos p ON iv.produto_id = p.id JOIN vendas v ON iv.venda_id = v.id
            WHERE v.data_venda >= DATE_TRUNC('month', CURRENT_DATE)`);
        res.json({ lucro_mensal: parseFloat(result.rows[0].lucro) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/estoque-entrada', verificarJWT, async (req, res) => {
    const { produto_id, quantidade, motivo } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateRes = await client.query('UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2 RETURNING nome, estoque_atual', [quantidade, produto_id]);
        await client.query('INSERT INTO movimentacoes_estoque (produto_id, tipo_movimentacao, quantidade, motivo) VALUES ($1, $2, $3, $4)', [produto_id, 'ENTRADA', quantidade, motivo || 'Reposição']);
        await client.query('COMMIT');
        res.json({ message: "Estoque atualizado!", novo_saldo: updateRes.rows[0].estoque_atual });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.get('/financeiro-detalhado', verificarJWT, async (req, res) => {
    try {
        const query = `
            SELECT v.id AS venda_id, c.nome_fantasia AS cliente, TO_CHAR(v.data_venda, 'DD/MM/YYYY') AS data, 
            v.valor_total AS faturamento, (v.valor_total - SUM(iv.quantidade * p.preco_custo)) AS lucro_bruto
            FROM vendas v JOIN clientes c ON v.cliente_id = c.id JOIN itens_venda iv ON v.id = iv.venda_id
            JOIN produtos p ON iv.produto_id = p.id GROUP BY v.id, c.nome_fantasia, v.data_venda, v.valor_total ORDER BY v.data_venda DESC`;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;