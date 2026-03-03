const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarJWT } = require('../middleware/auth');
const { validaIdParam } = require('../middleware/inputValidator');

router.param('id', validaIdParam);

// Listar todos os fornecedores (GET /api/fornecedores)
router.get('/', verificarJWT, async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM fornecedores ORDER BY razao_social ASC');
        res.json({
            success: true,
            fornecedores: resultado.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Criar fornecedor (POST /api/fornecedores)
router.post('/', verificarJWT, async (req, res) => {
    const { razao_social, cnpj, contato, telefone } = req.body;

    if (!razao_social || !cnpj) {
        return res.status(400).json({ success: false, message: 'Razão Social e CNPJ são obrigatórios.' });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO fornecedores (razao_social, cnpj, contato, telefone) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [razao_social, cnpj, contato, telefone]
        );
        res.status(201).json({
            success: true,
            message: 'Fornecedor cadastrado com sucesso',
            fornecedor: resultado.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Já existe um fornecedor com este CNPJ' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// Editar fornecedor (PUT /api/fornecedores/:id)
router.put('/:id', verificarJWT, async (req, res) => {
    const { id } = req.params;
    const { razao_social, cnpj, contato, telefone } = req.body;

    try {
        const resultado = await pool.query(
            `UPDATE fornecedores SET razao_social = $1, cnpj = $2, contato = $3, telefone = $4 
             WHERE id = $5 RETURNING *`,
            [razao_social, cnpj, contato, telefone, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
        }

        res.json({
            success: true,
            message: 'Fornecedor atualizado com sucesso',
            fornecedor: resultado.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Registrar Pedido de Compra / Entrada via Fornecedor (POST /api/fornecedores/pedido)
router.post('/pedido', verificarJWT, async (req, res) => {
    const { fornecedor_id, produto_id, quantidade, preco_custo } = req.body;

    if (!fornecedor_id || !produto_id || !quantidade || !preco_custo) {
        return res.status(400).json({ success: false, message: 'Fornecedor, Produto, Quantidade e Preço de Custo são obrigatórios.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Cria o Pedido de Compra
        const valorTotal = preco_custo * quantidade;
        const pedidoResult = await client.query(
            `INSERT INTO pedidos_compra (fornecedor_id, data_pedido, valor_total, status) 
             VALUES ($1, NOW(), $2, 'Recebido') RETURNING *`,
            [fornecedor_id, valorTotal]
        );
        const pedido_id = pedidoResult.rows[0].id;

        // 2. Cria o item do pedido
        await client.query(
            `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_custo) 
             VALUES ($1, $2, $3, $4)`,
            [pedido_id, produto_id, quantidade, preco_custo]
        );

        // 3. Atualiza o estoque do Produto
        await client.query(
            `UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2`,
            [quantidade, produto_id]
        );

        // 4. Registra no relatório de Movimentações
        await client.query(
            `INSERT INTO movimentacoes_estoque (produto_id, tipo_movimentacao, quantidade, motivo) 
             VALUES ($1, 'ENTRADA', $2, $3)`,
            [produto_id, quantidade, `Pedido de Compra #${pedido_id} (Fornecedor ID: ${fornecedor_id})`]
        );

        // 5. Opcional: Registrar automaticamente no Financeiro como Despesa Paga
        await client.query(
            `INSERT INTO financeiro (descricao, valor, tipo, data_vencimento, data_pagamento, status) 
             VALUES ($1, $2, 'Despesa', CURRENT_DATE, CURRENT_DATE, 'Pago')`,
            [`Pagamento Fornecimento Pedido #${pedido_id}`, valorTotal]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Entrada de mercadoria registrada e estoque atualizado!',
            pedido: pedidoResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
