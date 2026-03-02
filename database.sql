-- 0. Usuários do Sistema 
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) DEFAULT 'Vendedor'
);

-- Inserindo o Usuário Padrão Vercel: admin@inovaclean.com / Senha: 123456
INSERT INTO usuarios (nome, email, senha, cargo) 
VALUES ('Administrador', 'admin@inovaclean.com', '$2b$10$FVvXqtrQSra/VUrCMzay2e4hbvbsjii2tzPn.ug3.xnjxPPJCwx3Hi', 'Admin');

-- 1. Categorias de Produtos (Ex: Hospitalar, Escolar, Escritório)
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

-- 2. Fornecedores das mercadorias
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    contato VARCHAR(100),
    telefone VARCHAR(20)
);

-- 3. Produtos (O coração da distribuidora)
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    fornecedor_id INTEGER REFERENCES fornecedores(id),
    unidade_medida VARCHAR(20) NOT NULL, -- Ex: Litro, Galão 5L, Caixa, Unidade
    preco_custo DECIMAL(10, 2) NOT NULL,
    preco_venda DECIMAL(10, 2) NOT NULL,
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5, -- Alerta para reposição
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clientes (Foco B2B: Escolas, Hospitais, Empresas)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    tipo_cliente VARCHAR(50), -- Ex: Hospital, Escola, Condomínio
    cidade VARCHAR(100) DEFAULT 'Bacabal',
    estado VARCHAR(2) DEFAULT 'MA'
);

-- 5. Movimentação de Estoque (Histórico de Entradas e Saídas)
CREATE TABLE movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id),
    tipo_movimentacao VARCHAR(10) NOT NULL, -- 'ENTRADA' ou 'SAIDA'
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(255), -- Ex: Venda, Reposição, Produto Avariado
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categorias (nome, descricao) 
VALUES ('Hospitalar', 'Produtos de desinfecção para clínicas e hospitais');

-- 6.Cabeçalho da Venda
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10, 2) DEFAULT 0.00
);

-- 7.Itens da Venda (Produtos vinculados)
CREATE TABLE itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL
);

-- 8. Gestão Financeira (Despesas e Receitas)
CREATE TABLE financeiro (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'Receita' ou 'Despesa'
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(50) DEFAULT 'Pendente', -- 'Pendente', 'Pago', 'Atrasado'
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Orçamentos (Pré-Vendas)
CREATE TABLE orcamentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    data_orcamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Pendente' -- 'Pendente', 'Convertido', 'Cancelado'
);

CREATE TABLE itens_orcamento (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL
);

-- 10. Pedidos de Compra (Entrada de Estoque via Fornecida)
CREATE TABLE pedidos_compra (
    id SERIAL PRIMARY KEY,
    fornecedor_id INTEGER REFERENCES fornecedores(id),
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Recebido' -- 'Pendente', 'Recebido'
);

CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_custo DECIMAL(10, 2) NOT NULL
);