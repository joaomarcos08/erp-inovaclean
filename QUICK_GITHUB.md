# 📋 Checklist: Subindo para GitHub em 5 Minutos

## ✅ Antes de Começar
- [ ] Git instalado? Baixe em: https://git-scm.com/download/win
- [ ] Reiniciou o computador/terminal após instalar Git?
- [ ] Conta GitHub criada? https://github.com/signup
- [ ] Você está OFFLINE? (Para config inicial, sem conexão)

---

## 🚀 Passos Rápidos

### PASSO 1: Abra PowerShell
```
Windows + X → Windows PowerShell (Admin)
```

### PASSO 2: Configure seu Git (1ª vez apenas)
```powershell
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu.email@github.com"
```

### PASSO 3: Vá para a pasta do projeto
```powershell
cd d:\projeto
```

### PASSO 4: Inicializar Git e fazer commit
```powershell
git init
git add .
git commit -m "Initial commit: ERP InovaClean"
```

### PASSO 5: Criar repositório no GitHub
1. Acesse: https://github.com/new
2. Nome: `erp-inovaclean`
3. Descrição: `Sistema ERP para distribuição de produtos de limpeza`
4. Visibility: `Public` (ou Private)
5. Clique: **Create repository**

### PASSO 6: Conectar e fazer upload
Copie exatamente o comando na tela do GitHub (será tipo):

```powershell
git remote add origin https://github.com/SEU_USUARIO/erp-inovaclean.git
git branch -M main
git push -u origin main
```

Cole um por um no PowerShell.

### PASSO 7: Autenticar
Se pedir **username/password**:
- Username: SEU_USUARIO_GITHUB
- Password: Gere token em: https://github.com/settings/tokens/new
  - Marque: `repo` e `workflow`
  - Copie o token e cole como password

---

## ✨ Pronto!

Acesse: `https://github.com/SEU_USUARIO/erp-inovaclean`

Veja seu projeto no GitHub! 🎉

---

## 📚 Futuros Commits (mais rápido)

```powershell
git add .
git commit -m "Descrição da mudança"
git push
```

---

## 🆘 Erro "git: O termo não é reconhecido"?

**Solução:**
1. Reinstale Git: https://git-scm.com/download/win
2. Marque a opção: "Add Git to PATH"
3. Reinicie completamente o computador
4. Teste: `git --version`

---

## 🔑 Token do GitHub (se necessário)

1. Acesse: https://github.com/settings/tokens
2. Clique: **Generate new token (classic)**
3. Nome: `ERP Upload`
4. Marque: `repo`, `workflow`
5. Clique: **Generate token**
6. Copie e guarde em local seguro (não mostra novamente!)
7. Use como "password" quando pedir autenticação

---

## 📱 Próximas Alterações

Sempre que fizer mudanças:

```powershell
git add .
git commit -m "Fix: corrigir bug de cálculo de lucro"
git push
```

Pode abreviar:
```powershell
git add . && git commit -m "message" && git push
```

---

**Sucesso! 🚀**
