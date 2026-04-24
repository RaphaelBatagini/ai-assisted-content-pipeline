// Set required env vars before requiring app
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth', () => {
  let accessToken;

  test('POST /api/auth/register — creates user and returns access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  test('POST /api/auth/register — duplicate email returns 409', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login — valid credentials return access token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
  });

  test('POST /api/auth/login — invalid credentials return 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

describe('Sites', () => {
  let accessToken;
  let siteId;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
    accessToken = res.body.accessToken;
  });

  test('POST /api/sites — creates a site', async () => {
    const res = await request(app)
      .post('/api/sites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'My Blog',
        slug: 'my-blog',
        colorPalette: 'ocean_breeze',
        contactEmail: 'contact@myblog.com',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    siteId = res.body.id;
  });

  test('GET /api/sites — returns list of sites', async () => {
    const res = await request(app)
      .get('/api/sites')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/sites/:siteId — returns site', async () => {
    const res = await request(app)
      .get(`/api/sites/${siteId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(siteId);
  });

  describe('Posts', () => {
    let postId;

    test('POST /api/sites/:siteId/posts — creates a post', async () => {
      const res = await request(app)
        .post(`/api/sites/${siteId}/posts`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'My First Post',
          slug: 'my-first-post',
          content: 'This is the body of my first post. '.repeat(10),
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.readingTimeMinutes).toBeGreaterThan(0);
      postId = res.body.id;
    });

    test('PUT /api/sites/:siteId/posts/:postId/publish — publishes the post', async () => {
      const res = await request(app)
        .put(`/api/sites/${siteId}/posts/${postId}/publish`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('published');
      expect(res.body.publishedAt).toBeDefined();
    });
  });
});

describe('Health', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
