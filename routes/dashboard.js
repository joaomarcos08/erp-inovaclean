const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');

// Lucro Líquido do Mês
router.get('/lucro-mensal', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                COALESCE(SUM((p.preco_venda - p.preco_custo) * iv.quantidade), 0) AS lucro
            FROM vendas v
            JOIN itens_venda iv ON v.id = iv.venda_id
            JOIN produtos p ON iv.produto_id = p.id
            WHERE v.data_venda >= DATE_TRUNC('month', CURRENT_DATE)
        `);

        res.json({
            success: true,
            lucro: parseFloat(resultado.rows[0].lucro) || 0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Vendas de Hoje
router.get('/vendas-hoje', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT COALESCE(SUM(valor_total), 0) AS total 
            FROM vendas 
            WHERE data_venda >= CURRENT_DATE
        `);

        res.json({
            success: true,
            total: parseFloat(resultado.rows[0].total) || 0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Faturamento Mensal
router.get('/faturamento-mensal', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT COALESCE(SUM(valor_total), 0) AS total 
            FROM vendas 
            WHERE data_venda >= DATE_TRUNC('month', CURRENT_DATE)
        `);

        res.json({
            success: true,
            total: parseFloat(resultado.rows[0].total) || 0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Estoque Crítico
router.get('/estoque-critico', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nome, estoque_atual as estoque, estoque_minimo
            FROM produtos 
            WHERE estoque_atual <= estoque_minimo
            ORDER BY estoque_atual ASC
        `);

        res.json({
            success: true,
            produtos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Faturamento (Tendência / Gráfico de Linhas)
router.get('/faturamento-semana', verificarJWT, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        let whereClause = "v.data_venda >= CURRENT_DATE - INTERVAL '6 days'";
        let params = [];

        if (dataInicio && dataFim) {
            whereClause = "v.data_venda >= $1 AND v.data_venda <= $2";
            // Adicionamos 23:59:59 ao dataFim para garantir que pega todo o dia
            params = [dataInicio, `${dataFim} 23:59:59`];
        }

        const query = `
            WITH datas as (
                SELECT date_trunc('day', dd)::date as data
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) dd
            )
            SELECT 
                TO_CHAR(d.data, 'DD/MM/YYYY') as data,
                COALESCE(SUM(v.valor_total), 0) as total
            FROM datas d
            LEFT JOIN vendas v ON DATE(v.data_venda) = d.data
            GROUP BY d.data
            ORDER BY d.data ASC
        `;

        const resultado = await pool.query(query, params);

        res.json({
            success: true,
            labels: resultado.rows.map(r => r.data),
            data: resultado.rows.map(r => parseFloat(r.total))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Vendas por Categoria
router.get('/vendas-categoria', verificarJWT, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        let whereClause = "v.data_venda >= DATE_TRUNC('month', CURRENT_DATE)";
        let params = [];

        if (dataInicio && dataFim) {
            whereClause = "v.data_venda >= $1 AND v.data_venda <= $2";
            params = [dataInicio, `${dataFim} 23:59:59`];
        }

        const query = `
            SELECT 
                c.nome as categoria, 
                COALESCE(vendas_categoria.total, 0) as total_vendido
            FROM categorias c
            LEFT JOIN (
                SELECT p.categoria_id, SUM(iv.quantidade) as total
                FROM itens_venda iv
                JOIN produtos p ON iv.produto_id = p.id
                JOIN vendas v ON iv.venda_id = v.id
                WHERE ${whereClause}
                GROUP BY p.categoria_id
            ) AS vendas_categoria ON c.id = vendas_categoria.categoria_id
            ORDER BY total_vendido DESC
        `;

        const resultado = await pool.query(query, params);

        res.json({
            success: true,
            categorias: resultado.rows.map(r => r.categoria),
            quantidades: resultado.rows.map(r => parseInt(r.total_vendido))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Resumo geral (compatibilidade)
router.get('/resumo', verificarJWT, async (req, res) => {
    try {
        const vendasHoje = await pool.query(
            "SELECT COALESCE(SUM(valor_total), 0) AS total FROM vendas WHERE data_venda >= CURRENT_DATE"
        );

        const estoqueBaixo = await pool.query(
            "SELECT nome, estoque_atual, estoque_minimo FROM produtos WHERE estoque_atual <= estoque_minimo"
        );

        const faturamentoMes = await pool.query(
            "SELECT COALESCE(SUM(valor_total), 0) AS total FROM vendas WHERE data_venda >= DATE_TRUNC('month', CURRENT_DATE)"
        );

        res.json({
            success: true,
            vendas_hoje: parseFloat(vendasHoje.rows[0].total),
            faturamento_mensal: parseFloat(faturamentoMes.rows[0].total),
            alerta_estoque: estoqueBaixo.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============ FINANCEIRO ============
// Saldo do Dia (Vendas Hoje - Despesas Pagas Hoje)
router.get('/saldo-dia', verificarJWT, async (req, res) => {
    try {
        const vendasQuery = await pool.query(`
            SELECT COALESCE(SUM(valor_total), 0) AS total_vendas 
            FROM vendas 
            WHERE data_venda >= CURRENT_DATE
        `);
        const totalVendas = parseFloat(vendasQuery.rows[0].total_vendas);

        const despesasQuery = await pool.query(`
            SELECT COALESCE(SUM(valor), 0) AS total_despesas 
            FROM financeiro 
            WHERE tipo = 'Despesa' AND status = 'Pago' AND data_pagamento = CURRENT_DATE
        `);
        const totalDespesas = parseFloat(despesasQuery.rows[0].total_despesas);

        res.json({
            success: true,
            vendas: totalVendas,
            despesas_pagas: totalDespesas,
            saldo_liquido: totalVendas - totalDespesas
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Compromissos Financeiros de Hoje (Pendentes)
router.get('/compromissos-hoje', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, descricao, valor, data_vencimento
            FROM financeiro
            WHERE status = 'Pendente' AND tipo = 'Despesa' AND data_vencimento = CURRENT_DATE
            ORDER BY valor DESC
        `);

        res.json({
            success: true,
            compromissos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Sugestão de Compra (20% acima do mínimo)
router.get('/sugestao-compra', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nome, estoque_atual, estoque_minimo, preco_custo
            FROM produtos 
            WHERE estoque_atual <= (estoque_minimo * 1.2)
            ORDER BY estoque_atual ASC
        `);

        res.json({
            success: true,
            sugestoes: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Clientes Inativos (Não compram há > 30 dias em Bacabal)
router.get('/clientes-inativos', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                c.id, 
                c.nome_fantasia as nome, 
                MAX(v.data_venda) as ultima_compra
            FROM clientes c
            LEFT JOIN vendas v ON c.id = v.cliente_id
            WHERE c.cidade ILIKE '%Bacabal%'
            GROUP BY c.id, c.nome_fantasia
            HAVING MAX(v.data_venda) IS NULL OR MAX(v.data_venda) < CURRENT_DATE - INTERVAL '30 days'
            ORDER BY ultima_compra DESC NULLS LAST
        `);

        res.json({
            success: true,
            inativos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;