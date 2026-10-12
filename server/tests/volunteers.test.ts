import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { hashPassword } from '../lib/auth';
import { Member } from '../models/Member';
import { User } from '../models/User';

describe('volunteer opportunities', () => {
  it('allows members to apply and event staff to review applications', async () => {
    const password = 'StrongPassword123!';
    const staff = await User.create({ email: 'events@example.com', passwordHash: await hashPassword(password), role: 'event_manager' });
    const memberUser = await User.create({ email: 'member@example.com', passwordHash: await hashPassword(password), role: 'member' });
    await Member.create({
      userId: memberUser._id,
      fullName: 'Ayesha Hussain',
      studentId: 'LU-SSC-1042',
      department: 'Computer Science',
      semester: '4',
      preferredLanguage: 'skr',
      isActive: true,
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({ email: staff.email, password });
    const memberLogin = await request(app).post('/api/v1/auth/login').send({ email: memberUser.email, password });
    const staffCookie = staffLogin.headers['set-cookie'][0];
    const memberCookie = memberLogin.headers['set-cookie'][0];
    const opportunity = await request(app)
      .post('/api/v1/volunteers/manage')
      .set('Cookie', staffCookie)
      .send({
        title: 'Heritage Week welcome team',
        summary: 'Help welcome students and guests to our annual heritage gathering.',
        details: 'Assist with guest arrival, programme information, and accessibility support.',
        areas: ['Events', 'Community outreach'],
        venue: 'Leads University Auditorium',
      });
    const opportunityId = opportunity.body.data.opportunity._id as string;

    const memberList = await request(app).get('/api/v1/volunteers').set('Cookie', memberCookie);
    const application = await request(app).post(`/api/v1/volunteers/${opportunityId}/signup`).set('Cookie', memberCookie).send({ note: 'Available for the full event.' });
    const duplicate = await request(app).post(`/api/v1/volunteers/${opportunityId}/signup`).set('Cookie', memberCookie).send({});
    const staffList = await request(app).get('/api/v1/volunteers/manage').set('Cookie', staffCookie);
    const signupId = staffList.body.data.opportunities[0].signups[0].id as string;
    const accepted = await request(app).patch(`/api/v1/volunteers/manage/signups/${signupId}`).set('Cookie', staffCookie).send({ status: 'accepted' });
    const memberStatus = await request(app).get('/api/v1/volunteers').set('Cookie', memberCookie);

    expect(opportunity.status).toBe(201);
    expect(memberList.body.data.opportunities).toHaveLength(1);
    expect(application.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(staffList.body.data.opportunities[0].signups[0].memberId.fullName).toBe('Ayesha Hussain');
    expect(accepted.status).toBe(200);
    expect(memberStatus.body.data.opportunities[0].signupStatus).toBe('accepted');
  });
});