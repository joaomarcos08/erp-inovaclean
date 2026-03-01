# 🚀 Guia: SubindoERP InovaClean para o GitHub

## 📋 Pré-requisitos

1. **Git instalado** - Baixe em [git-scm.com](https://git-scm.com/download/win)
2. **Conta no GitHub** - Crie em [github.com](https://github.com/signup)

## ✅ Passo a Passo

### 1️⃣ Instalar Git (Windows)

1. Acesse https://git-scm.com/download/win
2. Baixe e instale a versão mais recente
3. Durante a instalação, acceite as opções padrão
4. Reinicie o terminal/PowerShell após instalar

### 2️⃣ Configurar Git Globalmente

Abra PowerShell e execute:

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@github.com"
```

### 3️⃣ Inicializar Repositório Local

No terminal, na pasta do projeto:

```powershell
cd d:\projeto
git init
git add .
git commit -m "Initial commit: ERP InovaClean com autenticação, produtos, clientes e vendas"
```

### 4️⃣ Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Preencha os campos:
   - **Repository name:** `erp-inovaclean` (ou o nome que preferir)
   - **Description:** "Sistema de gerenciamento para distribuidora de limpeza"
   - **Visibility:** Public (ou Private, sua escolha)
   - ✅ Marque: "Add a README file" (já temos um)
   - ✅ Marque: "Add .gitignore" (já temos um, mas GitHub oferecerá)

3. Clique em **Create repository**

### 5️⃣ Conectar Repositório Remoto

Após criar no GitHub, você receberá um link como:
`https://github.com/seu-usuario/erp-inovaclean.git`

Execute no PowerShell:

```powershell
cd d:\projeto
git remote add origin https://github.com/seu-usuario/erp-inovaclean.git
git branch -M main
git push -u origin main
```

Se pedir credenciais:
- **Username:** seu usuario do GitHub
- **Password:** gere um Personal Access Token em https://github.com/settings/tokens

### 6️⃣ Verificar Upload

Acesse seu repositório em:
`https://github.com/seu-usuario/erp-inovaclean`

Você verá todos os arquivos lá (exceto os do `.gitignore`)!

## 🔐 Usar SSH (Alternativa - Mais Seguro)

Se preferir usar SSH em vez de HTTPS:

### Gerar Chave SSH

```powershell
ssh-keygen -t ed25519 -C "seu.email@github.com"
```

Pressione Enter para aceitar o caminho padrão e deixe a senha vazia.

### Adicionar Chave ao GitHub

1. Copie o conteúdo de: `C:\Users\seu-usuario\.ssh\id_ed25519.pub`
2. Vá em https://github.com/settings/keys
3. Clique em **New SSH key**
4. Cole a chave e salve

### Usar SSH no Repositório

```powershell
git remote add origin git@github.com:seu-usuario/erp-inovaclean.git
git branch -M main
git push -u origin main
```

## 📝 Commits Futuros

Depois de fazer alterações:

```powershell
git add .
git commit -m "Descrição clara da mudança"
git push
```

## ⚙️ Verificar Status

```powershell
# Ver arquivos modificados
git status

# Ver commit history
git log

# Ver repositório remoto
git remote -v
```

## 🛑 Problemas Comuns

### "fatal: not a git repository"
**Solução:** Certifique-se de estar na pasta correta: `cd d:\projeto`

### "Please tell me who you are"
**Solução:** Configure git como em "Passo 2"

### "fatal: remote already exists"
**Solução:** 
```powershell
git remote remove origin
git remote add origin https://github.com/seu-usuario/erp-inovaclean.git
```

### "Permission denied (publickey)"
**Solução:** Configure SSH corretamente ou use HTTPS em vez de SSH

## 📚 Arquivos Importantes

**NÃO** serão enviados (estão no `.gitignore`):
- ❌ `.env` (credenciais sensíveis)
- ❌ `node_modules/` (muito pesado)
- ❌ Logs e cache

**SERÃO** enviados:
- ✅ `.env.example` (template)
- ✅ `package.json` e `package-lock.json`
- ✅ Código-fonte
- ✅ README e documentação

## 🎓 O Que Fazer Depois

1. **Settings do Repositório:**
   - Clique em "Settings" > "Pages"
   - Ative GitHub Pages (opcional, para documentação)

2. **Branch Protection:**
   - Clique em "Settings" > "Branches"
   - Proteja a branch `main` para evitar deletes acidentais

3. **Adicionar Colaboradores:**
   - Clique em "Settings" > "Collaborators"
   - Invite pessoas para contribuir

4. **Issues e Projects:**
   - Use para rastrear bugs e features
   - Organize tasks com o Kanban board

## 📱 Clonar em Outra Máquina

Depois que subir para GitHub:

```powershell
git clone https://github.com/seu-usuario/erp-inovaclean.git
cd erp-inovaclean
npm install
npm run setup-admin
npm run dev
```

---

**Dúvidas?** Procure por "git" + sua dúvida no Google ou em https://stackoverflow.com
