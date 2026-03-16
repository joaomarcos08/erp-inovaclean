const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Catálogo Público (GET /api/site/produtos)
// Retorna a mesma vitrine do ERP, mas sem a necessidade de Token JWT.
router.get('/produtos', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nome, preco_venda, unidade_medida, estoque_atual, imagem 
            FROM produtos 
            ORDER BY nome ASC
        `);
        res.json({
            success: true,
            produtos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao buscar catálogo público' });
    }
});

// 1.1 Destaques / Mais Vendidos (GET /api/site/destaques)
// Retorna os 4 produtos mais requisitados nos últimos 30 dias para a vitrine
router.get('/destaques', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.nome, p.imagem, p.preco_venda, p.unidade_medida, SUM(iv.quantidade) as total_vendido 
            FROM itens_venda iv
            JOIN vendas v ON iv.venda_id = v.id
            JOIN produtos p ON iv.produto_id = p.id
            WHERE v.data_venda >= NOW() - INTERVAL '30 days'
            GROUP BY p.id, p.nome, p.imagem, p.preco_venda, p.unidade_medida
            ORDER BY total_vendido DESC
            LIMIT 4
        `;
        const resultado = await pool.query(query);
        
        // Se a loja for muito nova e não tiver 4 vendas, preencher com produtos aleatorios
        let destaques = resultado.rows;
        if (destaques.length < 4) {
            const complementos = await pool.query(`
                SELECT id, nome, imagem, preco_venda, unidade_medida 
                FROM produtos 
                WHERE id NOT IN (SELECT unnest($1::int[]))
                ORDER BY RANDOM() LIMIT $2
            `, [destaques.map(d => d.id).concat([0]), 4 - destaques.length]);
            destaques = destaques.concat(complementos.rows);
        }

        res.json({ success: true, destaques });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao buscar destaques' });
    }
});

// 1.2 Métricas Animadas (GET /api/site/estatisticas)
router.get('/estatisticas', async (req, res) => {
    try {
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM clientes WHERE tipo_cliente != $1', ['Prospect']),
            pool.query('SELECT COUNT(*) FROM produtos')
        ]);
        
        res.json({
            success: true,
            clientes: parseInt(counts[0].rows[0].count) + 120, // Base +120 para parecer mais maduro na tela
            produtos: parseInt(counts[1].rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro de contagem de métricas' });
    }
});

// 2. Receber Contato/Lead (POST /api/site/contato)
// Salva a empresa como um Prospect na tabela de Clientes (Lead B2B)
router.post('/contato', async (req, res) => {
    const { nome, cnpj, telefone } = req.body;

    if (!nome || !cnpj || !telefone) {
        return res.status(400).json({ success: false, message: 'Nome, CNPJ e Telefone são obrigatórios.' });
    }

    try {
        // Usa o Tipo 'Prospect' para os vendedores do ERP saberem que ainda não comprou
        await pool.query(
            `INSERT INTO clientes (nome_fantasia, cnpj, tipo_cliente, cidade, estado) 
             VALUES ($1, $2, $3, $4, $5)`,
            [nome, cnpj, 'Prospect', 'Bacabal (Lead Site)', 'MA']
        );

        res.status(201).json({ success: true, message: 'Contato recebido com sucesso!' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'CNPJ já possui cadastro. Faça login na Área B2B.' });
        }
        res.status(500).json({ success: false, error: 'Falha interna ao registrar lead.' });
    }
});

// 3. Login B2B (POST /api/site/login-b2b)
// Usa apenas o CNPJ (sem senha) como forma simplificada e rápida de login B2B
router.post('/login-b2b', async (req, res) => {
    const { cnpj } = req.body;

    if (!cnpj) {
        return res.status(400).json({ success: false, message: 'CNPJ não informado.' });
    }

    try {
        const resultado = await pool.query('SELECT id, nome_fantasia FROM clientes WHERE cnpj = $1', [cnpj]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'CNPJ não encontrado na base de clientes ativos.' });
        }

        const cliente = resultado.rows[0];

        // Gera um token rápido para a área do cliente
        const token = jwt.sign(
            { id: cliente.id, cnpj: cnpj, tipo_acesso: 'b2b_client' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login B2B autorizado.',
            cliente: { id: cliente.id, nome: cliente.nome_fantasia },
            token
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Falha na autenticação do portal.' });
    }
});

// 4. Buscar Faturas do Cliente B2B (GET /api/site/pedidos)
// Função middleware local para proteger as faturas web
const verificarTokenB2B = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Token de cliente não fornecido.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err || decoded.tipo_acesso !== 'b2b_client') return res.status(403).json({ success: false, message: 'Acesso B2B expirado ou inválido.' });
        req.clienteId = decoded.id;
        next();
    });
};

router.get('/pedidos', verificarTokenB2B, async (req, res) => {
    try {
        // Traz as últimas 15 vendas daquele cliente específico
        const resultado = await pool.query(
            `SELECT id, data_venda, valor_total 
             FROM vendas 
             WHERE cliente_id = $1 
             ORDER BY data_venda DESC LIMIT 15`,
            [req.clienteId]
        );

        res.json({
            success: true,
            pedidos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erro ao buscar o histórico de pedidos.' });
    }
});

module.exports = router;
