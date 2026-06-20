/**
 * Factory middleware to validate integer URL parameters.
 * @param {string[]} paramNames Names of parameters to validate.
 */
function validateParams(paramNames) {
    return (req, res, next) => {
        for (const paramName of paramNames) {
            if (req.params[paramName] !== undefined) {
                const id = parseInt(req.params[paramName], 10);
                if (isNaN(id) || id <= 0) {
                    return res.status(400).json({ 
                        error: `El parámetro "${paramName}" debe ser un número entero positivo válido.` 
                    });
                }
                req.params[paramName] = id;
            }
        }
        next();
    };
}

module.exports = validateParams;
