process.env.JWT_SECRET = 'test-access-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test-db';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const Todo = require('../models/Todo');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/Todo', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

describe('auth routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('signup creates a user and returns a token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: 'u1', name: 'Ada', email: 'ada@example.com' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Ada', email: 'ADA@example.com', password: 'correct-password' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(User.create).toHaveBeenCalled();
  });

  test('login rejects an invalid password', async () => {
    User.findOne.mockResolvedValue({
      _id: 'u1',
      name: 'Ada',
      email: 'ada@example.com',
      password: bcrypt.hashSync('correct-password', 10),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-pass' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('todo routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns only todos visible to the logged-in user', async () => {
    User.find.mockResolvedValue([{ _id: 'u1' }]);
    Todo.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 't1', title: 'Visible task', user: 'u1' }]) });

    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(Todo.find).toHaveBeenCalled();
  });

  test('share route validates email input', async () => {
    const res = await request(app)
      .post('/api/todos/share')
      .set('Authorization', 'Bearer validtoken')
      .send({ email: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });
});
