/**
 * DTO para la respuesta de un Empleado (Empleado Response DTO)
 * Se encarga de formatear la salida del empleado enviado al cliente,
 * exponiendo únicamente el id (como String), nombre y apellido.
 */
class EmpleadoResponseDto {
    constructor(empleado) {
        this.id = String(empleado.id);
        this.nombre = empleado.nombre;
        this.apellido = empleado.apellido;
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Empleado al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Empleado.
     * @returns {EmpleadoResponseDto|EmpleadoResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new EmpleadoResponseDto(item));
        }
        return new EmpleadoResponseDto(data);
    }
}

module.exports = EmpleadoResponseDto;
