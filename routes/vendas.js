const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');
const { validaIdParam } = require('../middleware/inputValidator');

router.param('id', validaIdParam);

// Criar venda (POST /api/vendas)
router.post('/', verificarJWT, async (req, res) => {
    const { cliente_id, itens, forma_pagamento } = req.body;

    if (!cliente_id || !itens || itens.length === 0) {
        return res.status(400).json({ success: false, message: 'Cliente e itens são obrigatórios' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Calcula valor total
        let valor_total = 0;
        itens.forEach(item => {
            valor_total += item.preco_unitario * item.quantidade;
        });

        // Insere venda (Sem campos descontinuados: vendedor_id, forma_pagamento, status)
        const vendaResult = await client.query(
            'INSERT INTO vendas (cliente_id, valor_total, data_venda) VALUES ($1, $2, NOW()) RETURNING *',
            [cliente_id, valor_total]
        );

        const venda_id = vendaResult.rows[0].id;

        // Insere itens da venda e atualiza estoque
        for (const item of itens) {
            await client.query(
                'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                [venda_id, item.produto_id, item.quantidade, item.preco_unitario]
            );

            await client.query(
                'UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2',
                [item.quantidade, item.produto_id]
            );
        }

        // Gera Conta a Receber no Financeiro
        let statusFinanceiro = 'Pago';
        let dataPgto = 'CURRENT_DATE';
        if (forma_pagamento === 'Boleto' || forma_pagamento === 'A Prazo') {
            statusFinanceiro = 'Pendente';
            dataPgto = 'NULL';
        }

        await client.query(
            `INSERT INTO financeiro (descricao, valor, tipo, data_vencimento, status, data_pagamento) 
             VALUES ($1, $2, 'Receita', CURRENT_DATE, $3, ${dataPgto})`,
            [`Receita de Venda #${venda_id}`, valor_total, statusFinanceiro]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Venda realizada com sucesso',
            venda: vendaResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

// Rota de HISTÓRICO (GET /api/vendas/historico)
router.get('/historico', verificarJWT, async (req, res) => {
    let { inicio, fim } = req.query;

    try {
        let query = `
            SELECT v.id, v.data_venda, v.valor_total, c.nome_fantasia as cliente
            FROM vendas v
            JOIN clientes c ON v.cliente_id = c.id
        `;
        const params = [];

        if (inicio && fim && inicio !== 'undefined' && inicio !== '') {
            query += ` WHERE v.data_venda::date BETWEEN $1 AND $2 `;
            params.push(inicio, fim);
        }

        query += ` ORDER BY v.data_venda DESC`;

        const result = await pool.query(query, params);
        res.json({
            success: true,
            vendas: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Detalhes de uma venda (GET /api/vendas/:id)
router.get('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const venda = await pool.query(
            'SELECT v.*, c.nome_fantasia as cliente FROM vendas v JOIN clientes c ON v.cliente_id = c.id WHERE v.id = $1',
            [id]
        );
        const itens = await pool.query(
            'SELECT iv.*, p.nome FROM itens_venda iv JOIN produtos p ON iv.produto_id = p.id WHERE iv.venda_id = $1',
            [id]
        );

        if (venda.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Venda não encontrada' });
        }

        res.json({
            success: true,
            venda: venda.rows[0],
            itens: itens.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cancelar Venda (POST /api/vendas/:id/cancelar)
router.post('/:id/cancelar', verificarJWT, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar se a venda existe
        const vendaCheck = await client.query('SELECT id FROM vendas WHERE id = $1', [id]);
        if (vendaCheck.rows.length === 0) {
            throw new Error('Venda não encontrada');
        }

        // 2. Deletar a Venda Física do Relatório (Como a tabela não tem mais coluna 'status' de Cancelada)
        await client.query("DELETE FROM vendas WHERE id = $1", [id]);

        // 3. Estornar estoque
        const itens = await client.query('SELECT produto_id, quantidade FROM itens_venda WHERE venda_id = $1', [id]);
        for (const item of itens.rows) {
            await client.query(
                'UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2',
                [item.quantidade, item.produto_id]
            );
        }

        // 4. Cancelar financeiro atrelado alterando o título, já que não temos 'conta_origem' nem flag restrita.
        await client.query(
            "UPDATE financeiro SET status = 'Atrasado', descricao = $1 WHERE descricao LIKE $2",
            [`[CANCELADO] Venda #${id}`, `Receita de Venda #${id}%`]
        );

        await client.query('COMMIT');

        res.json({ success: true, message: 'Venda cancelada com sucesso. Estoque e financeiro estornados.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;