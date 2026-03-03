const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT, verificarAdmin } = require('../middleware/auth');
const { validaIdParam } = require('../middleware/inputValidator');

router.param('id', validaIdParam);

// Listar todos os usuários (GET /api/usuarios) - Apenas Admin
router.get('/', verificarJWT, verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query('SELECT id, nome, email, cargo FROM usuarios ORDER BY nome ASC');
        res.json({
            success: true,
            usuarios: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Atualizar cargo do usuário (PUT /api/usuarios/:id) - Apenas Admin
router.put('/:id', verificarJWT, verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { cargo } = req.body;

    if (!cargo || (cargo !== 'admin' && cargo !== 'vendedor')) {
        return res.status(400).json({ success: false, message: 'Cargo inválido. Use "admin" ou "vendedor".' });
    }

    try {
        const result = await pool.query(
            'UPDATE usuarios SET cargo = $1 WHERE id = $2 RETURNING id, nome, email, cargo',
            [cargo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            message: 'Cargo atualizado com sucesso',
            usuario: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Deletar Usuário (DELETE /api/usuarios/:id) - Apenas Admin
router.delete('/:id', verificarJWT, verificarAdmin, async (req, res) => {
    const { id } = req.params;

    // Proteção extra: não deixar deletar o próprio usuário logado
    if (parseInt(id) === req.usuarioId) {
        return res.status(403).json({ success: false, message: 'Você não pode deletar a sua própria conta.' });
    }

    try {
        const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({ success: true, message: 'Usuário deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
