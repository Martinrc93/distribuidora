const userService = require('../services/userService');
const { UserCreateDto } = require('../dtos/user/request');
const { UserResponseDto } = require('../dtos/user/response');

exports.obtenerTodos = async (req, res) => {
    try {
        const usuarios = await userService.obtenerTodos();
        res.json(UserResponseDto.fromModel(usuarios));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerUsuario = async (req, res) => {
    try {
        const usuario = await userService.obtenerPorId(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json(UserResponseDto.fromModel(usuario));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.guardarUsuario = async (req, res) => {
    try {
        const userDto = new UserCreateDto(req.body);
        const validation = userDto.validate();
        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }
        const nuevo = await userService.crear(userDto);
        res.status(201).json(UserResponseDto.fromModel(nuevo));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};