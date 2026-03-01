const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET não definida nas variáveis de ambiente');
}

function verificarJWT(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Token não fornecido." 
      });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        const status = err.name === 'TokenExpiredError' ? 401 : 403;
        return res.status(status).json({ 
          success: false,
          message: err.name === 'TokenExpiredError' ? "Token expirado." : "Token inválido." 
        });
      }
      req.usuarioId = decoded.id;
      req.usuarioCargo = decoded.cargo;
      next();
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Erro ao verificar token" 
    });
  }
}

function verificarAdmin(req, res, next) {
  if (req.usuarioCargo !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas administradores podem realizar esta ação."
    });
  }
  next();
}

module.exports = { verificarJWT, verificarAdmin, SECRET_KEY };