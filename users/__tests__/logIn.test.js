import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// Sustituimos el módulo de modelos por completo antes de importar la app
vi.mock('../models/index.js', () => ({
    Usuario: {
        findOne: vi.fn(),
        create: vi.fn()
    },
    // Mockeamos sequelize para que no intente conectar a una DB real al arrancar
    sequelize: {
        authenticate: vi.fn().mockResolvedValue(),
        sync: vi.fn().mockResolvedValue()
    }
}))

// Importamos la app y el modelo mockeado
import app from '../users-service.js'
import { Usuario } from '../models/index.js'

describe('Pruebas de Inicio de Sesión', () => {

    beforeEach(() => {
        // Limpiamos el historial de llamadas de las funciones mockeadas
        vi.clearAllMocks()
    })

    it('debería iniciar sesión con éxito si las credenciales son correctas', async () => {
        // Simulamos un usuario en BD con el hash correcto para "password123"
        const usuarioMock = {
            id_usuario: 1,
            nombre: "Test User",
            nom_usuario: "testuser",
            contrasena: "123$70617373776f7264313233" 
        }

        // Configuramos el mock para que devuelva este usuario
        Usuario.findOne.mockResolvedValue(usuarioMock)

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "password123" })

        // Verificamos que el login es exitoso
        expect(res.status).toBe(200)
        expect(res.body.nom_usuario).toBe("testuser")
    })

    it('debería fallar si el nick no cumple la validación de longitud', async () => {
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "abc", contrasena: "password123" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
        expect(res.body.nom_usuario).toBe("El nick debe tener entre 4 y 30 caracteres.")
    })

    it('debería fallar si la contraseña es demasiado corta', async () => {
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "123" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
        expect(res.body.contrasena).toBe("La contraseña debe tener al menos 8 caracteres.")
    })

    it('debería fallar si el usuario no existe en el sistema', async () => {
        // El mock devuelve null, simulando que el nick no está en la BD
        Usuario.findOne.mockResolvedValue(null)

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "nadie", contrasena: "password123" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
    })

    it('debería fallar si la contraseña es incorrecta', async () => {
        // Usuario con una contraseña que no coincidirá con la que enviamos
        Usuario.findOne.mockResolvedValue({
            nom_usuario: "testuser",
            contrasena: "sal$hashincorrecto"
        })

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "passwordErronea" })

        //Salta error (400)   
        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })
})