const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');
const { validaIdParam } = require('../middleware/inputValidator');

router.param('id', validaIdParam);

// Listar lançamentos financeiros
router.get('/', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT * FROM financeiro 
            ORDER BY data_vencimento DESC, id DESC
        `);
        res.json({
            success: true,
            lancamentos: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Registrar um novo lançamento (Despesa ou Receita)
router.post('/', verificarJWT, async (req, res) => {
    // (Removido 'conta_origem' que foi deletado do PostgreSQL pelo usuário)
    const { descricao, valor, tipo, data_vencimento, status } = req.body;

    if (!descricao || !valor || !tipo || !data_vencimento) {
        return res.status(400).json({ success: false, message: 'Descrição, valor, tipo e data de vencimento são obrigatórios' });
    }

    try {
        const finalStatus = status || 'Pendente';
        const dataPagamento = finalStatus === 'Pago' ? new Date().toISOString().split('T')[0] : null;

        const resultado = await pool.query(
            `INSERT INTO financeiro (descricao, valor, tipo, data_vencimento, status, data_pagamento) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [descricao, valor, tipo, data_vencimento, finalStatus, dataPagamento]
        );
        res.status(201).json({
            success: true,
            message: `${tipo} registrada com sucesso`,
            lancamento: resultado.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Marcar lançamento como pago/recebido
router.put('/:id/pagar', verificarJWT, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `UPDATE financeiro 
             SET status = 'Pago', data_pagamento = CURRENT_DATE 
             WHERE id = $1 RETURNING *`,
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Lançamento não encontrado' });
        }

        res.json({
            success: true,
            message: 'Lançamento marcado como pago/recebido',
            lancamento: resultado.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cancelar/Deletar lançamento financeiro
router.delete('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM financeiro WHERE id = $1 RETURNING *', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Lançamento não encontrado' });
        }
        res.json({ success: true, message: 'Lançamento removido com sucesso' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Rota legada para registrar despesa (compatibilidade)
router.post('/despesa', verificarJWT, async (req, res) => {
    const { descricao, valor, data_vencimento, status } = req.body;
    if (!descricao || !valor || !data_vencimento) {
        return res.status(400).json({ success: false, message: 'Descrição, valor e data de vencimento são obrigatórios' });
    }
    try {
        const finalStatus = status || 'Pendente';
        const dataPagamento = finalStatus === 'Pago' ? new Date().toISOString().split('T')[0] : null;

        const resultado = await pool.query(
            `INSERT INTO financeiro (descricao, valor, tipo, data_vencimento, status, data_pagamento) 
             VALUES ($1, $2, 'Despesa', $3, $4, $5) RETURNING *`,
            [descricao, valor, data_vencimento, finalStatus, dataPagamento]
        );
        res.status(201).json({ success: true, message: 'Despesa registrada com sucesso', despesa: resultado.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
