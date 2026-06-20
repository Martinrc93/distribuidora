/**
 * Global Error Handling Middleware for Express
 */
function errorHandler(err, req, res, next) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Unhandled Error:', err);
    }
    
    const status = err.statusCode || err.status || 500;
    let message = err.message || 'Error interno del servidor';
    
    if (status === 500 && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        message = 'Error interno del servidor';
    }
    
    res.status(status).json({ 
        error: message 
    });
}

module.exports = errorHandler;
