const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'test-user-id-123',
      email: 'test@example.com',
      role: req.headers['x-test-role'] || 'brand',
      banned: false,
    };
    next();
  },
  requireRole: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  },
}));

jest.mock('../src/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ to: jest.fn().mockReturnThis(), emit: jest.fn() })),
}));

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  setupExpressErrorHandler: jest.fn(() => (err, req, res, next) => next(err)),
}));

process.env.PORT = '0';
process.env.NODE_ENV = 'test';

const db = require('../src/config/db');
const server = require('../src/app');

afterAll(async () => {
  if (server && server.close) {
    await new Promise(resolve => server.close(resolve));
  }
});

describe('Profile Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profiles/', () => {
    it('should return the current user profile', async () => {
      const mockProfile = {
        user_id: 'test-user-id-123',
        name: 'Test Brand',
        bio: 'A test brand',
        categories: ['tech'],
        budget_min: 1000,
        budget_max: 5000,
      };
      db.query.mockResolvedValueOnce({ rows: [mockProfile] });

      const res = await request(server).get('/api/profiles/');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Brand');
    });

    it('should return 404 if profile does not exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(server).get('/api/profiles/');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/profiles/', () => {
    it('should update profile with valid data', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE
      db.query.mockResolvedValueOnce({ rows: [{ user_id: 'test-user-id-123', name: 'Updated Brand' }] }); // re-fetch

      const res = await request(server)
        .put('/api/profiles/')
        .send({ name: 'Updated Brand', budget_min: 2000 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Brand');
    });

    it('should reject non-numeric budget_min with 422', async () => {
      const res = await request(server)
        .put('/api/profiles/')
        .send({ budget_min: 'not-a-number' });

      expect(res.status).toBe(422);
    });

    it('should reject non-numeric lat/lng with 422', async () => {
      const res = await request(server)
        .put('/api/profiles/')
        .send({ lat: 'abc', lng: 'xyz' });

      expect(res.status).toBe(422);
    });
  });
});
