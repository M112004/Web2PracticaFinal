const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock para el módulo de envío de emails
jest.mock('../../utils/mailer', () => ({
  sendVerification: jest.fn().mockResolvedValue(true),
  sendPasswordReset: jest.fn().mockResolvedValue(true),
  sendInvitation: jest.fn().mockResolvedValue(true)
}));

describe('User Controller', () => {
  // Test para el registro de usuario
  describe('POST /api/users/register', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      
      // Verificar que el usuario se creó en la base de datos
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.validated).toBe(false);
      expect(user.validationCode).toBeTruthy();
    });

    it('debería devolver error si falta email o password', async () => {
      await request(app)
        .post('/api/users/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      await request(app)
        .post('/api/users/register')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('debería devolver error si el email ya está registrado', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // Crear usuario primero
      await request(app)
        .post('/api/users/register')
        .send(userData);

      // Intentar crear de nuevo con el mismo email
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  // Test para el login
  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Crear un usuario para probar el login
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'login@example.com',
        password: hashedPassword,
        validated: true
      });
    });

    it('debería hacer login correctamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('debería devolver error con credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería rechazar login si el email no está validado', async () => {
      // Crear usuario sin validar
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'notvalidated@example.com',
        password: hashedPassword,
        validated: false
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'notvalidated@example.com',
          password: 'password123'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  // Test para la validación de email
  describe('PUT /api/users/validation', () => {
    let token;
    let validationCode;

    beforeEach(async () => {
      // Crear un usuario con código de validación
      validationCode = 'ABC123';
      const user = await User.create({
        email: 'validate@example.com',
        password: await bcrypt.hash('password123', 10),
        validationCode,
        validated: false
      });

      // Generar token para este usuario
      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testSecret');
    });

    it('debería validar el email con código correcto', async () => {
      const response = await request(app)
        .put('/api/users/validation')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: validationCode })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verificar que el usuario ahora está validado
      const user = await User.findOne({ email: 'validate@example.com' });
      expect(user.validated).toBe(true);
      expect(user.validationCode).toBeNull();
    });

    it('debería rechazar código incorrecto', async () => {
      const response = await request(app)
        .put('/api/users/validation')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: 'WRONG' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});