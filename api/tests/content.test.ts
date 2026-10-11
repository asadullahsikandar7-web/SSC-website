import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../server';
import { hashPassword } from '../lib/auth';
import { User } from '../models/User';

describe('editorial content', () => {
  it('keeps drafts private and exposes content after staff publish it', async () => {
    const password = 'StrongPassword123!';
    await User.create({ email: 'editor@example.com', passwordHash: await hashPassword(password), role: 'editor' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'editor@example.com', password });
    const cookie = login.headers['set-cookie'][0];
    const draft = await request(app).post('/api/v1/content/manage').set('Cookie', cookie).send({
      contentType: 'announcement',
      slug: 'heritage-week-dates',
      title: 'Heritage Week dates announced',
      summary: 'The council has shared the dates for this year’s Heritage Week programme.',
      body: 'The programme will include student performances, language workshops, and community conversations.',
      locale: 'en',
      status: 'draft',
    });

    const publicDraftList = await request(app).get('/api/v1/content/announcement');
    const publicDraftDetail = await request(app).get('/api/v1/content/announcement/heritage-week-dates');
    const publish = await request(app)
      .patch(`/api/v1/content/manage/${draft.body.data.item.id}`)
      .set('Cookie', cookie)
      .send({ status: 'published' });
    const publicList = await request(app).get('/api/v1/content/announcement?locale=en');

    expect(draft.status).toBe(201);
    expect(publicDraftList.body.data.items).toHaveLength(0);
    expect(publicDraftDetail.status).toBe(404);
    expect(publish.status).toBe(200);
    expect(publicList.body.data.items).toHaveLength(1);
    expect(publicList.body.data.items[0].title).toBe('Heritage Week dates announced');
    expect(publicList.body.data.items[0]._id).toBeUndefined();
  });

  it('rejects anonymous editorial changes and duplicate section slugs', async () => {
    const password = 'StrongPassword123!';
    await User.create({ email: 'editor@example.com', passwordHash: await hashPassword(password), role: 'editor' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'editor@example.com', password });
    const payload = {
      contentType: 'article',
      slug: 'living-heritage',
      title: 'Living heritage on campus',
      summary: 'A reflection on language and culture in student life.',
      body: 'Students carry language, memory, and tradition into a changing campus community.',
      locale: 'skr',
      status: 'published',
    };

    const anonymous = await request(app).post('/api/v1/content/manage').send(payload);
    const first = await request(app).post('/api/v1/content/manage').set('Cookie', login.headers['set-cookie'][0]).send(payload);
    const duplicate = await request(app).post('/api/v1/content/manage').set('Cookie', login.headers['set-cookie'][0]).send(payload);

    expect(anonymous.status).toBe(401);
    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(409);
  });
});