@echo off
REM Script para preparar o projeto para upload no GitHub
REM Execute este arquivo após instalar Git no Windows

ECHO.
ECHO ========================================
ECHO - Preparando ERP InovaClean para GitHub -
ECHO ========================================
ECHO.

REM Verificar se git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    ECHO.
    ECHO [ERRO] Git nao esta instalado!
    ECHO.
    ECHO Baixe em: https://git-scm.com/download/win
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO [OK] Git encontrado!
ECHO.

REM Verificar configuração global do Git
ECHO Digite seu nome de usuario do GitHub (para commits):
SET /P GIT_USER="> "

ECHO.
ECHO Digite seu email do GitHub:
SET /P GIT_EMAIL="> "

ECHO.
ECHO Configurando Git...
git config --global user.name "%GIT_USER%"
git config --global user.email "%GIT_EMAIL%"

ECHO.
ECHO [OK] Configuracao salva!
ECHO.

REM Inicializar repositório
ECHO Inicializando repositorio Git...
if exist .git (
    ECHO [AVISO] Repositorio ja existe, pulando...
) else (
    git init
    ECHO [OK] Repositorio inicializado
)

ECHO.
ECHO Adicionando arquivos...
git add .

ECHO.
ECHO Criando primeiro commit...
git commit -m "Initial commit: ERP InovaClean com autenticacao, produtos, clientes e vendas"

ECHO.
ECHO ========================================
ECHO - Proximo Passo -
ECHO ========================================
ECHO.
ECHO 1. Acesse: https://github.com/new
ECHO 2. Crie um novo repositorio com o nome: erp-inovaclean
ECHO 3. Copie o link do repositorio (https://...)
ECHO 4. Execute o comando abaixo (substitua o link):
ECHO.
ECHO    git remote add origin https://github.com/SEU_USUARIO/erp-inovaclean.git
ECHO    git branch -M main
ECHO    git push -u origin main
ECHO.
ECHO 5. Se pedir credenciais, use seu usuario/token do GitHub
ECHO.
ECHO Para mais informacoes, veja: GITHUB_SETUP.md
ECHO.
PAUSE
