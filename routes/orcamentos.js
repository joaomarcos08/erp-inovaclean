const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');

// Criar orçamento (POST /api/orcamentos)
router.post('/', verificarJWT, async (req, res) => {
    const { cliente_id, itens } = req.body;

    if (!cliente_id || !itens || itens.length === 0) {
        return res.status(400).json({ success: false, message: 'Cliente e itens são obrigatórios' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let valor_total = 0;
        itens.forEach(item => {
            valor_total += item.preco_unitario * item.quantidade;
        });

        const orcResult = await client.query(
            'INSERT INTO orcamentos (cliente_id, valor_total, data_orcamento) VALUES ($1, $2, NOW()) RETURNING *',
            [cliente_id, valor_total]
        );

        const orcamento_id = orcResult.rows[0].id;

        for (const item of itens) {
            await client.query(
                'INSERT INTO itens_orcamento (orcamento_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                [orcamento_id, item.produto_id, item.quantidade, item.preco_unitario]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Orçamento salvo com sucesso',
            orcamento: orcResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

// Histórico de orçamentos (GET /api/orcamentos/historico)
router.get('/historico', verificarJWT, async (req, res) => {
    let { inicio, fim } = req.query;

    try {
        let query = `
            SELECT o.id, o.data_orcamento, o.valor_total, o.status, c.nome_fantasia as cliente
            FROM orcamentos o
            JOIN clientes c ON o.cliente_id = c.id
        `;
        const params = [];

        if (inicio && fim && inicio !== 'undefined' && inicio !== '') {
            query += ` WHERE o.data_orcamento::date BETWEEN $1 AND $2 `;
            params.push(inicio, fim);
        }

        query += ` ORDER BY o.data_orcamento DESC`;

        const result = await pool.query(query, params);
        res.json({
            success: true,
            orcamentos: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Detalhes de um orçamento (GET /api/orcamentos/:id)
router.get('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const orcamento = await pool.query(
            'SELECT o.*, c.nome_fantasia as cliente, c.cnpj, c.cidade, c.estado FROM orcamentos o JOIN clientes c ON o.cliente_id = c.id WHERE o.id = $1',
            [id]
        );
        const itens = await pool.query(
            'SELECT io.*, p.nome, p.unidade_medida FROM itens_orcamento io JOIN produtos p ON io.produto_id = p.id WHERE io.orcamento_id = $1',
            [id]
        );

        if (orcamento.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
        }

        res.json({
            success: true,
            orcamento: orcamento.rows[0],
            itens: itens.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Converter orçamento em Venda (POST /api/orcamentos/:id/converter)
router.post('/:id/converter', verificarJWT, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Pega dados do orçamento
        const orcResult = await client.query('SELECT * FROM orcamentos WHERE id = $1', [id]);
        if (orcResult.rows.length === 0) throw new Error('Orçamento não encontrado');
        const orcamento = orcResult.rows[0];

        if (orcamento.status === 'Convertido') throw new Error('Orçamento já foi convertido em venda');

        // 2. Cria a venda
        const vendaResult = await client.query(
            'INSERT INTO vendas (cliente_id, valor_total, data_venda) VALUES ($1, $2, NOW()) RETURNING *',
            [orcamento.cliente_id, orcamento.valor_total]
        );
        const venda_id = vendaResult.rows[0].id;

        // 3. Pega itens do orçamento
        const itensResult = await client.query('SELECT * FROM itens_orcamento WHERE orcamento_id = $1', [id]);
        const itens = itensResult.rows;

        // 4. Insere em itens_venda e atualiza estoque
        for (const item of itens) {
            await client.query(
                'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                [venda_id, item.produto_id, item.quantidade, item.preco_unitario]
            );

            // Atualiza o estoque AGORA (já que é uma venda real)
            await client.query(
                'UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2',
                [item.quantidade, item.produto_id]
            );
        }

        // 5. Marca o orçamento como convertido
        await client.query("UPDATE orcamentos SET status = 'Convertido' WHERE id = $1", [id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Orçamento convertido em venda com sucesso',
            venda: vendaResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
