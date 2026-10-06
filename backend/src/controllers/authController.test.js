const { register, login } = require('./authController');

// Mock db so tests don't need a real SQLite/SQLCipher database
jest.mock('../models/db', () => ({
  db: {
    prepare: jest.fn(() => ({
      get: jest.fn(),
      run: jest.fn(),
    })),
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hashSync: jest.fn(() => '$2b$12$hashedpassword'),
  compareSync: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock.jwt.token'),
}));

const { db } = require('../models/db');
const bcrypt = require('bcryptjs');

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  return res;
}

// ── Register validation ───────────────────────────────────────────────────────

describe('register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects missing fields', () => {
    const res = makeRes();
    register({ body: { name: 'Alice', email: 'a@b.com' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects password shorter than 8 characters', () => {
    const res = makeRes();
    register({ body: { name: 'Alice', email: 'a@b.com', password: 'short' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('8') }));
  });

  test('accepts password of exactly 8 characters', () => {
    db.prepare.mockReturnValue({ get: jest.fn(() => null), run: jest.fn(() => ({ lastInsertRowid: 1 })) });
    const res = makeRes();
    register({ body: { name: 'Alice', email: 'a@b.com', password: '12345678' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('rejects invalid email format', () => {
    const res = makeRes();
    register({ body: { name: 'Alice', email: 'notanemail', password: '12345678' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 409 when email already exists', () => {
    db.prepare.mockReturnValue({ get: jest.fn(() => ({ id: 1 })) });
    const res = makeRes();
    register({ body: { name: 'Alice', email: 'a@b.com', password: '12345678' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('does not reveal whether email is registered in conflict message', () => {
    db.prepare.mockReturnValue({ get: jest.fn(() => ({ id: 1 })) });
    const res = makeRes();
    register({ body: { name: 'Alice', email: 'a@b.com', password: '12345678' } }, res);
    const msg = res.json.mock.calls[0][0].error.toLowerCase();
    expect(msg).not.toContain('already');
    expect(msg).not.toContain('registered');
    expect(msg).not.toContain('taken');
  });
});

// ── Login validation ──────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects missing credentials', () => {
    const res = makeRes();
    login({ body: { email: 'a@b.com' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 401 for unknown email', () => {
    db.prepare.mockReturnValue({ get: jest.fn(() => null) });
    bcrypt.compareSync.mockReturnValue(false);
    const res = makeRes();
    login({ body: { email: 'a@b.com', password: 'wrongpass' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for wrong password', () => {
    db.prepare.mockReturnValue({
      get: jest.fn(() => ({ id: 1, name: 'Alice', email: 'a@b.com', password_hash: '$2b$12$hash' })),
    });
    bcrypt.compareSync.mockReturnValue(false);
    const res = makeRes();
    login({ body: { email: 'a@b.com', password: 'wrongpass' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('succeeds with correct credentials', () => {
    db.prepare.mockReturnValue({
      get: jest.fn(() => ({ id: 1, name: 'Alice', email: 'a@b.com', password_hash: '$2b$12$hash' })),
    });
    bcrypt.compareSync.mockReturnValue(true);
    const res = makeRes();
    login({ body: { email: 'a@b.com', password: 'correctpass' } }, res);
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.any(Object) }));
  });

  test('does not return password_hash in response', () => {
    db.prepare.mockReturnValue({
      get: jest.fn(() => ({ id: 1, name: 'Alice', email: 'a@b.com', password_hash: '$2b$12$hash' })),
    });
    bcrypt.compareSync.mockReturnValue(true);
    const res = makeRes();
    login({ body: { email: 'a@b.com', password: 'correctpass' } }, res);
    const returned = res.json.mock.calls[0][0];
    expect(returned.user.password_hash).toBeUndefined();
  });
});
