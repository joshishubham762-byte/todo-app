process.env.JWT_SECRET = 'test-access-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test-db';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const Todo = require('../models/Todo');

function makeToken(userId = 'u1') {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/Todo', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
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

  test('creates a todo for the logged-in user', async () => {
    Todo.countDocuments.mockResolvedValue(0);
    Todo.create.mockResolvedValue({ _id: 't1', title: 'New task', user: 'u1', category: 'General', dueDate: null });

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken('u1')}`)
      .send({ title: 'New task', dueDate: '2026-09-01', category: 'Personal' });

    expect(res.status).toBe(201);
    expect(Todo.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'New task', user: 'u1' }));
  });

  test('returns only todos visible to the logged-in user', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'u1' }]),
    });
    Todo.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 't1', title: 'Visible task', user: 'u1' }]) });

    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${makeToken('u1')}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(Todo.find).toHaveBeenCalled();
  });

  test('share route validates email input', async () => {
    const res = await request(app)
      .post('/api/todos/share')
      .set('Authorization', `Bearer ${makeToken('u1')}`)
      .send({ email: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });
});
