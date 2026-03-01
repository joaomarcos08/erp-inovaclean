const bcrypt = require('bcrypt');
const pool = require('./db');
require('dotenv').config();

async function criarAdminPadrao() {
    try {
        console.log('🔧 Configurando usuário administrativo...');
        
        const email = 'admin@inovaclean.com';
        const senha = '123456';
        const nome = 'Administrador InovaClean';
        const cargo = 'Administrador';
        
        // Verifica se já existe
        const resultado = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );
        
        if (resultado.rows.length > 0) {
            console.log('✅ Usuário admin já existe!');
            process.exit(0);
        }
        
        // Criptografa a senha
        const senhaHash = await bcrypt.hash(senha, 10);
        
        // Cria o usuário
        await pool.query(
            'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4)',
            [nome, email, senhaHash, cargo]
        );
        
        console.log('✅ Usuário administrativo criado com sucesso!');
        console.log('📧 Email: ' + email);
        console.log('🔑 Senha: ' + senha);
        console.log('⚠️  Altere a senha após o primeiro login!');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao criar usuário:', err.message);
        process.exit(1);
    }
}

criarAdminPadrao();
