import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../server';
import { hashPassword } from '../lib/auth';
import { ContactMessage } from '../models/ContactMessage';
import { User } from '../models/User';

describe('public contact inbox', () => {
  it('validates, stores, and protects contact enquiries for staff follow-up', async () => {
    const payload = {
      fullName: 'Ayesha Hussain',
      email: 'ayesha@leads.edu.pk',
      subject: 'Cultural collaboration',
      message: 'I would like to discuss a language and storytelling session for students.',
      privacyAcknowledged: true,
      website: '',
    };
    const invalid = await request(app).post('/api/v1/contact').send({ ...payload, privacyAcknowledged: false });
    const submission = await request(app).post('/api/v1/contact').send(payload);
    const stored = await ContactMessage.findOne({ email: payload.email });

    expect(invalid.status).toBe(400);
    expect(submission.status).toBe(201);
    expect(submission.body.data.emailStatus).toBe('skipped');
    expect(stored?.subject).toBe(payload.subject);

    const anonymousInbox = await request(app).get('/api/v1/contact/manage');
    const password = 'StrongPassword123!';
    await User.create({ email: 'editor@example.com', passwordHash: await hashPassword(password), role: 'editor' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'editor@example.com', password });
    const cookie = login.headers['set-cookie'][0];
    const inbox = await request(app).get('/api/v1/contact/manage').set('Cookie', cookie);
    const markRead = await request(app).patch(`/api/v1/contact/${submission.body.data.id}/read`).set('Cookie', cookie);
    const refreshedInbox = await request(app).get('/api/v1/contact/manage').set('Cookie', cookie);

    expect(anonymousInbox.status).toBe(401);
    expect(inbox.body.data.messages).toHaveLength(1);
    expect(markRead.status).toBe(200);
    expect(refreshedInbox.body.data.messages[0].readAt).toBeTruthy();
  });
});