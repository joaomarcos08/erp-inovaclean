# 📦 ERP InovaClean - Gestão B2B Avançada

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

Sistema de gerenciamento empresarial (ERP) projetado para **Distribuidoras de Produtos de Limpeza** operarem de forma rápida, segura e com visão total de caixa, estoque e clientes. Adaptado para design *Mobile-first*.

---

## ✨ Novidades e Features

*   **🛡️ Cibersegurança:** Escudos ativos via **Helmet** (CSP estrito contra XSS) e **Rate Limiter** bloqueando Força Bruta contra endpoints de Login/Cadastro (máx. 10 reqs/15m).
*   **📊 Relatórios em PDF & Gráficos:** Geração instantânea de notas de orçamento para o cliente em PDF (via *html2pdf.js*) e monitoramento dinâmico de gráficos faturados (via *Chart.js*).
*   **📱 100% Responsivo:** Telas de gestão, tabelas flexíveis com scroll automático e métricas ajustáveis que funcionam perfeitamente na tela do celular de administradores fora da empresa.
*   **🗄️ Financeiro e Estoque Inteligentes:** Sugestões matemáticas de quando comprar (produto < mínimo), listagem de clientes inativos (> 30 dias na cidade) e módulo completo de despesas vs receitas do dia.

---

## 🛠️ Tecnologias e Pacotes

| Categoria | Biblioteca/Tecnologia | Objetivo |
| :--- | :--- | :--- |
| **Backend Core** | `express`, `pg` | Roteamento REST API e driver de comunicação eficiente com banco PostgreSQL. |
| **Segurança** | `bcrypt`, `jsonwebtoken` | Criptografia irreversível de senhas e geração de sessões sem cookies (Tokens Bearer). |
| **Defesa API** | `helmet`, `express-rate-limit` | Prevenção a clickjacking, cross-site scripting e negação de serviço (DDoS/Brute-force). |
| **Ambiente** | `dotenv`, `cors`, `nodemon` | Definição de supervariáveis (DB, Secret), regras de domínios confiáveis e Reload em tempo real. |
| **Frontend** | *HTML5, CSS3 Grid, Vanilla JS* | Performance pura cliente-side dispensando pesados interpretadores de frameworks React/Vue. |

---

## 🚀 Como Executar o Projeto Localmente

### 1. Preparando o Banco de Dados (PostgreSQL)

Execute o arquivo de estruturação contendo as 10 entidades centrais do ERP. Abra o pgAdmin (ou terminal psql):
1. Crie o banco `erp_distribuidora`
2. Copie e cole os códigos presentes do script `database.sql`.

### 2. Configurações Ambiente (`.env`)

Crie o arquivo inviolável `.env` na pasta raiz e popule-o com o seu setup:

```env
# Banco de Dados
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=erp_distribuidora
DB_PASSWORD=senha_do_seu_banco
DB_PORT=5432

# Segurança 
JWT_SECRET=super_secret_key_jwt_2026
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# Aplicação
PORT=3000
```

### 3. Setup de Dependências Mágicas

```bash
# Isso baixará pastas necessárias com base no package.json
npm install
```

### 4. Ligando os Motores!

```bash
# Sobe o servidor já blindado contra falhas na porta escolhida
npm run dev
```

*Sua aplicação poderá ser acessada visualmente abrindo o navegador no endereço: `http://localhost:3000`*

---

## 📚 Endpoints Essenciais

A aplicação opera seguindo padrões REST de alta performance, devolvendo cargas em puro JSON. Rotas são blindadas via verificação silenciosa `verificarJWT`.

### 🧑‍💼 Contas & Sessões
- `POST /api/auth/register` - *(Sujeito a bloqueio pós 10 falhas/IP)*
- `POST /api/auth/login` - Gera Bearer Token ativo no Front.

### 💰 Financeiro & Orçamentos (Novos)
- `GET /api/financeiro` - Busca painel Contas a Pagar/Receber
- `GET /api/financeiro/saldo-dia` - Receitas de Vendas VS Pagos
- `POST /api/orcamentos` - Salva relatórios de compras não-efetivadas
- `GET /api/orcamentos/imprimir/:id` - Devolve DOM para o *html2pdf*

### 🛍️ Vendas & Produtos
- `POST /api/vendas` - Desvenda caixa e subtrai estoque do produto
- `GET /api/produtos` - Listagem do catálogo e Custo vs Margem
- `GET /api/fornecedores` - Cadastro e consulta relacional para Entradas

### 📈 Painel Analítico de Dashboard
- `GET /api/dashboard/clientes-inativos` - Checa inatividade de > 30 dias
- `GET /api/dashboard/sugestao-compra` - Cruzamento estoque vs tolerância
- `GET /api/dashboard/faturamento-semana` - Eixos cartesianos X e Y para View.

---

## 👨🏽‍💻 Devs e Contribuidores

Construído de forma modular para fácil escalabilidade por **InovaClean - Unidade Bacabal/MA**. 
*(Utilize o arquivo de tarefas `task.md` e `walkthrough.md` incluídos nas modificações geradas pela IA para continuar a arquitetura sem quebrar)*.
