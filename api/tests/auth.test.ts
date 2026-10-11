import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../server';
import { hashPassword, verifyPassword } from '../lib/auth';
import { User } from '../models/User';

describe('auth helpers and user model', () => {
  it('hashes and verifies a password', async () => {
    const password = 'StrongPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it('creates a user record with a unique email and default role', async () => {
    const user = await User.create({
      email: 'admin@example.com',
      passwordHash: 'hashed-value',
      firstName: 'Admin',
      lastName: 'User',
    });

    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('member');
    expect(user.isActive).toBe(true);
  });

  it('logs in and authorizes a user session', async () => {
    const password = 'StrongPassword123!';
    const hashed = await hashPassword(password);

    await User.create({
      email: 'member@example.com',
      passwordHash: hashed,
      role: 'member',
      isActive: true,
    });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@example.com', password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers['set-cookie'][0]).toContain('ssc_session=');

    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', loginResponse.headers['set-cookie'][0]);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.email).toBe('member@example.com');
  });

  it('rejects malformed and incorrect login attempts without creating a session', async () => {
    const password = 'StrongPassword123!';
    await User.create({
      email: 'member@example.com',
      passwordHash: await hashPassword(password),
    });

    const malformedResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'short' });
    const incorrectResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@example.com', password: 'WrongPassword123!' });

    expect(malformedResponse.status).toBe(400);
    expect(incorrectResponse.status).toBe(401);
    expect(incorrectResponse.headers['set-cookie']).toBeUndefined();
  });

  it('enforces role access and revokes a session at logout', async () => {
    const password = 'StrongPassword123!';
    await User.create({
      email: 'member@example.com',
      passwordHash: await hashPassword(password),
      role: 'member',
    });
    await User.create({
      email: 'admin@example.com',
      passwordHash: await hashPassword(password),
      role: 'admin',
    });

    const anonymousResponse = await request(app).get('/api/v1/admin-check');
    const memberLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@example.com', password });
    const memberResponse = await request(app)
      .get('/api/v1/admin-check')
      .set('Cookie', memberLogin.headers['set-cookie'][0]);
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password });
    const adminResponse = await request(app)
      .get('/api/v1/admin-check')
      .set('Cookie', adminLogin.headers['set-cookie'][0]);

    expect(anonymousResponse.status).toBe(401);
    expect(memberResponse.status).toBe(403);
    expect(adminResponse.status).toBe(200);

    const cookie = memberLogin.headers['set-cookie'][0];
    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);
    const revokedSessionResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(logoutResponse.status).toBe(200);
    expect(revokedSessionResponse.status).toBe(401);
  });
});
