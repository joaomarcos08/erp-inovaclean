const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT, verificarAdmin } = require('../middleware/auth');

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

router.get('/dre', verificarJWT, verificarAdmin, async (req, res) => {
    try {
        const { mes, ano } = req.query;
        let filtroVendas = '';
        let filtroDespesas = " AND f.status = 'Pago' ";
        const paramsVendas = [];
        const paramsDespesas = [];

        if (mes && ano) {
            filtroVendas = ' WHERE EXTRACT(MONTH FROM v.data_venda) = $1 AND EXTRACT(YEAR FROM v.data_venda) = $2 ';
            paramsVendas.push(mes, ano);
            filtroDespesas += ' AND EXTRACT(MONTH FROM COALESCE(f.data_pagamento, f.data_vencimento)) = $1 AND EXTRACT(YEAR FROM COALESCE(f.data_pagamento, f.data_vencimento)) = $2 ';
            paramsDespesas.push(mes, ano);
        }

        const client = await pool.connect();
        try {
            // 1. Receita Bruta
            const resReceita = await client.query(`SELECT COALESCE(SUM(valor_total), 0) AS receita_bruta FROM vendas v ${filtroVendas}`, paramsVendas);
            const receitaBruta = parseFloat(resReceita.rows[0].receita_bruta);

            // 2. CMV (Custo da Mercadoria Vendida)
            const resCmv = await client.query(`
                SELECT COALESCE(SUM(iv.quantidade * p.preco_custo), 0) AS cmv
                FROM itens_venda iv
                JOIN produtos p ON iv.produto_id = p.id
                JOIN vendas v ON iv.venda_id = v.id
                ${filtroVendas}
            `, paramsVendas);
            const cmv = parseFloat(resCmv.rows[0].cmv);

            // 3. Lucro Bruto
            const lucroBruto = receitaBruta - cmv;

            // 4. Despesas Operacionais (status = 'Pago')
            const resDespesas = await client.query(`SELECT COALESCE(SUM(valor), 0) AS despesas FROM financeiro f WHERE tipo = 'Despesa' ${filtroDespesas}`, paramsDespesas);
            const despesas = parseFloat(resDespesas.rows[0].despesas);

            // 5. Lucro Líquido
            const lucroLiquido = lucroBruto - despesas;

            res.json({
                success: true,
                receita_bruta: receitaBruta,
                cmv: cmv,
                lucro_bruto: lucroBruto,
                despesas: despesas,
                lucro_liquido: lucroLiquido
            });
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;