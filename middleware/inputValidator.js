/**
 * Middleware para Validadores de Tipo Estrito nas Rotas
 * Impede que strings sejam passadas quando o Backend e o DB (PostgreSQL) exigem Inteiros
 */

const validaIdParam = (req, res, next) => {
    const { id } = req.params;

    // Se a rota possuir um :id mas ele não for estritamente um número inteiro válido
    if (id && isNaN(parseInt(id, 10))) {
        return res.status(400).json({
            success: false,
            message: "Parâmetro ID inválido. Um número era esperado."
        });
    }

    next();
};

module.exports = {
    validaIdParam
};
