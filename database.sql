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

-- Cabeçalho da Venda
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10, 2) DEFAULT 0.00
);

-- Itens da Venda (Produtos vinculados)
CREATE TABLE itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL
);
