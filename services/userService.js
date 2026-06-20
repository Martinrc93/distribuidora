const User = require('../models/user.js');

exports.obtenerTodos = async () => {
  return await User.findAll();
};

exports.obtenerPorId = async (id) => {
  return await User.findByPk(id);
};

exports.crear = async (datos) => {
  return await User.create({
    nombre: datos.nombre
  });
};