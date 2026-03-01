const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { SECRET_KEY } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Validação de entrada
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarSenha(senha) {
  return senha && senha.length >= 6;
}

router.post('/register', loginLimiter, async (req, res) => {
  try {
    const { nome, email, senha, cargo } = req.body;

    // Validação
    if (!nome || !email || !senha || !cargo) {
      return res.status(400).json({
        success: false,
        message: "Nome, email, senha e cargo são obrigatórios"
      });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email inválido"
      });
    }

    if (!validarSenha(senha)) {
      return res.status(400).json({
        success: false,
        message: "Senha deve ter no mínimo 6 caracteres"
      });
    }

    const senhaCripto = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo',
      [nome, email, senhaCripto, cargo]
    );

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso!",
      usuario: resultado.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: "E-mail já cadastrado"
      });
    }

    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar usuário"
    });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios"
      });
    }

    const userRes = await pool.query(
      'SELECT id, nome, email, senha, cargo FROM usuarios WHERE email = $1',
      [email]
    );

    const usuario = userRes.rows[0];

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "E-mail ou senha inválidos"
      });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: "E-mail ou senha inválidos"
      });
    }

    const token = jwt.sign(
      { id: usuario.id, cargo: usuario.cargo },
      SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo
      }
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer login"
    });
  }
});

module.exports = router;