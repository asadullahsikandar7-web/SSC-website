import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { hashPassword } from '../lib/auth';
import { User } from '../models/User';

const eventPayload = {
  title: 'Saraiki Heritage Evening',
  slug: 'saraiki-heritage-evening',
  summary: 'An evening of Saraiki language, storytelling, and student performances.',
  description: 'Join students and guests for performances, stories, and a shared celebration of living heritage.',
  startsAt: '2027-02-10T15:00:00.000Z',
  endsAt: '2027-02-10T18:00:00.000Z',
  venue: 'Leads University Auditorium',
  capacity: 1,
  registrationOpen: true,
  status: 'published',
};

describe('events and registrations', () => {
  it('protects event publishing and exposes published events publicly', async () => {
    const anonymousCreate = await request(app).post('/api/v1/events').send(eventPayload);
    const password = 'StrongPassword123!';
    await User.create({ email: 'events@example.com', passwordHash: await hashPassword(password), role: 'event_manager' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'events@example.com', password });
    const cookie = login.headers['set-cookie'][0];
    const creation = await request(app).post('/api/v1/events').set('Cookie', cookie).send(eventPayload);
    const listing = await request(app).get('/api/v1/events');
    const detail = await request(app).get('/api/v1/events/saraiki-heritage-evening');

    expect(anonymousCreate.status).toBe(401);
    expect(creation.status).toBe(201);
    expect(listing.body.data.events).toHaveLength(1);
    expect(detail.body.data.event.title).toBe(eventPayload.title);
  });

  it('requires consent, blocks duplicate registrations, and enforces event capacity', async () => {
    const password = 'StrongPassword123!';
    await User.create({ email: 'events@example.com', passwordHash: await hashPassword(password), role: 'event_manager' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'events@example.com', password });
    const cookie = login.headers['set-cookie'][0];
    await request(app).post('/api/v1/events').set('Cookie', cookie).send(eventPayload);

    const invalidRegistration = await request(app)
      .post('/api/v1/events/saraiki-heritage-evening/registrations')
      .send({ fullName: 'Ayesha Hussain', email: 'ayesha@leads.edu.pk', studentId: 'LU-SSC-1042', privacyAcknowledged: false });
    const registration = await request(app)
      .post('/api/v1/events/saraiki-heritage-evening/registrations')
      .send({ fullName: 'Ayesha Hussain', email: 'ayesha@leads.edu.pk', studentId: 'LU-SSC-1042', privacyAcknowledged: true });
    const duplicate = await request(app)
      .post('/api/v1/events/saraiki-heritage-evening/registrations')
      .send({ fullName: 'Ayesha Hussain', email: 'ayesha@leads.edu.pk', studentId: 'LU-SSC-1042', privacyAcknowledged: true });
    const full = await request(app)
      .post('/api/v1/events/saraiki-heritage-evening/registrations')
      .send({ fullName: 'Bilal Ahmed', email: 'bilal@leads.edu.pk', studentId: 'LU-SSC-1043', privacyAcknowledged: true });
    const attendees = await request(app)
      .get('/api/v1/events/saraiki-heritage-evening/registrations')
      .set('Cookie', cookie);

    expect(invalidRegistration.status).toBe(400);
    expect(registration.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(full.status).toBe(409);
    expect(attendees.status).toBe(200);
    expect(attendees.body.data.registrations).toHaveLength(1);
  });
});