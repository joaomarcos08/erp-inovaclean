# ERP InovaClean - Distribuidora em Bacabal/MA

## 📋 Sobre o Projeto
Sistema de gerenciamento empresarial (ERP) para controle de vendas, clientes, produtos e estoque da distribuidora de limpeza InovaClean.

## 🛠️ Tecnologias Utilizadas
- **Backend:** Node.js + Express
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (JSON Web Tokens)
- **Frontend:** HTML5 + CSS3 + JavaScript Vanilla

## 📦 Dependências
- `express` - Framework web
- `cors` - Middleware para requisições cross-origin
- `jsonwebtoken` - Autenticação com JWT
- `bcrypt` - Criptografia de senhas
- `pg` - Driver PostgreSQL
- `dotenv` - Variáveis de ambiente
- `nodemon` - Desenvolvimento em tempo real

## 🚀 Como Começar

### 1. Configurar o Banco de Dados PostgreSQL

Execute os comandos SQL do arquivo `database.sql` para criar as tabelas:

```bash
psql -U postgres -d erp_distribuidora -f database.sql
```

Ou manualmente no pgAdmin:
1. Crie um novo banco de dados chamado `erp_distribuidora`
2. Execute o conteúdo de `database.sql`

### 2. Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=erp_distribuidora
DB_PASSWORD=sua_senha_aqui
DB_PORT=5432

# JWT
JWT_SECRET=chave_secreta_muito_segura_2024
JWT_EXPIRES_IN=2h

# Aplicação
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Criar Usuário Administrativo

No PostgreSQL, execute:

```sql
INSERT INTO usuarios (nome, email, senha, cargo) 
VALUES ('Admin', 'admin@inovaclean.com', 
        '$2b$10$YIvxHU8lNlPDPvVzHgHi.uBNWlbQzNl0BzNKMN.F8oF8kL8Rw6iZG', 
        'Administrador');
```

**Credenciais padrão:**
- Email: `admin@inovaclean.com`
- Senha: `123456`

### 5. Iniciar o Servidor

**Modo desenvolvimento (com hot reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor rodará em `http://localhost:3000`

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login

### Produtos
- `GET /api/produtos` - Listar todos
- `GET /api/produtos/:id` - Buscar um produto
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Editar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Clientes
- `GET /api/clientes` - Listar todos
- `POST /api/clientes` - Criar cliente

### Vendas
- `POST /api/vendas` - Criar venda
- `GET /api/vendas/historico` - Histórico de vendas
- `GET /api/vendas/:id` - Detalhes da venda

### Dashboard
- `GET /api/dashboard/lucro-mensal` - Lucro do mês
- `GET /api/dashboard/vendas-hoje` - Vendas de hoje
- `GET /api/dashboard/faturamento-mensal` - Faturamento do mês
- `GET /api/dashboard/estoque-critico` - Produtos com estoque baixo

## 🔐 Autenticação

A aplicação usa JWT Bearer tokens. Após login, o token é salvo em `localStorage`.

Para requisições autenticadas, envie no header:
```
Authorization: Bearer seu_token_aqui
```

## 💾 Estrutura de Pastas

```
projeto/
├── public/
│   ├── index.html          # Página principal
│   ├── css/
│   │   └── style.css       # Estilos
│   └── js/
│       └── app.js          # JavaScript frontend
├── routes/
│   ├── auth.js             # Rotas de autenticação
│   ├── produtos.js         # Rotas de produtos
│   ├── clientes.js         # Rotas de clientes
│   ├── vendas.js           # Rotas de vendas
│   ├── dashboard.js        # Rotas do dashboard
│   └── relatorios.js       # Rotas de relatórios
├── middleware/
│   └── auth.js             # Middleware de autenticação JWT
├── db.js                   # Conexão com PostgreSQL
├── server.js               # Servidor Express
├── package.json            # Dependências
├── .env                    # Variáveis de ambiente (não commitar)
├── .env.example            # Exemplo de variáveis
└── database.sql            # Script de criação de tabelas
```

## 🧪 Testando a Aplicação

1. **Fazer Login:** Use as credenciais criadas
2. **Cadastrar Cliente:** Adicione um novo cliente
3. **Cadastrar Produto:** Adicione um novo produto
4. **Registrar Venda:** Selecione cliente e produto, adicione ao carrinho e finalize
5. **Visualizar Dashboard:** Verifique lucro, estoque e histórico

## ⚠️ Notas Importantes

- **Não commite `.env`** com senhas reais
- Use `.env.example` como template
- Senhas são criptografadas com bcrypt
- JWT expira em 2 horas (configurável)
- Verifique se PostgreSQL está rodando
- Porta padrão: 3000 (configurável via PORT=xxxx)

## 🐛 Troubleshooting

**Erro: "JWT_SECRET não definida"**
- Verifique se o arquivo `.env` existe e tem `JWT_SECRET`

**Erro: "ECONNREFUSED" (PostgreSQL)**
- Verifique se PostgreSQL está rodando
- Verifique credenciais de acesso em `.env`

**Erro: "401 Unauthorized"**
- Token expirado ou inválido
- Faça login novamente

## 📝 Licença
MIT

## 👨‍💼 Desenvolvido por
InovaClean - Bacabal/MA
