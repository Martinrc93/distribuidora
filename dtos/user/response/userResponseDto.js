/**
 * DTO para la respuesta de un Usuario (User Response DTO)
 */
class UserResponseDto {
    constructor(user) {
        this.id = user.id;
        this.nombre = user.nombre;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo User al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo User.
     * @returns {UserResponseDto|UserResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new UserResponseDto(item));
        }
        return new UserResponseDto(data);
    }
}

module.exports = UserResponseDto;
