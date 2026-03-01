const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');

// Listar todos (GET /api/produtos)
router.get('/', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM produtos ORDER BY nome ASC');
        res.json({
            success: true,
            produtos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Buscar um produto (GET /api/produtos/:id)
router.get('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        if (resultado.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }
        res.json(resultado.rows[0]);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Criar produto (POST /api/produtos)
router.post('/', verificarJWT, async (req, res) => {
    const { nome, categoria_id, preco_custo, preco_venda, estoque_inicial, estoque_minimo, unidade } = req.body;
    
    if (!nome || !preco_custo || !preco_venda) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios faltando' });
    }
    
    try {
        const resultado = await pool.query(
            `INSERT INTO produtos (nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade_medida)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [nome, categoria_id || 1, preco_custo, preco_venda, estoque_inicial || 0, estoque_minimo || 10, unidade || 'Unidade']
        );
        res.status(201).json({
            success: true,
            message: 'Produto criado com sucesso',
            produto: resultado.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Editar Produto (PUT /api/produtos/:id)
router.put('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    const { nome, categoria_id, preco_custo, preco_venda, estoque_minimo, unidade_medida } = req.body;
    try {
        const result = await pool.query(
            `UPDATE produtos SET nome = $1, categoria_id = $2, preco_custo = $3, 
             preco_venda = $4, estoque_minimo = $5, unidade_medida = $6 WHERE id = $7 RETURNING *`,
            [nome, categoria_id, preco_custo, preco_venda, estoque_minimo, unidade_medida, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Produto atualizado com sucesso',
            produto: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Deletar Produto (DELETE /api/produtos/:id)
router.delete('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }
        
        res.json({ success: true, message: 'Produto deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;