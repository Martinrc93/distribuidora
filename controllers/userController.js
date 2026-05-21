const userService = require('../services/userService');

exports.obtenerTodos = async (req, res) => {
    try {
        const usuarios = await userService.obtenerTodos();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerUsuario = async (req, res) => {
    try {
        const usuario = await userService.obtenerPorId(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json(usuario);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.guardarUsuario = async (req, res) => {
    try {
        const nuevo = await userService.crear(req.body);
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};