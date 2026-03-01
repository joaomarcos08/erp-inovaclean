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

module.exports = router;