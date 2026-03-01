const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');

router.get('/', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT id, nome_fantasia as nome, cnpj, tipo_cliente as tipo, cidade, estado FROM clientes ORDER BY nome_fantasia ASC'
        );
        res.json({
            success: true,
            clientes: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', verificarJWT, async (req, res) => {
    const { nome, cnpj, tipo, cidade, estado } = req.body;
    
    if (!nome || !cnpj) {
        return res.status(400).json({ success: false, message: 'Nome e CNPJ são obrigatórios' });
    }
    
    try {
        const novoCliente = await pool.query(
            'INSERT INTO clientes (nome_fantasia, cnpj, tipo_cliente, cidade, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, cnpj, tipo || 'Empresa', cidade || 'Bacabal', estado || 'MA']
        );
        res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            cliente: novoCliente.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;