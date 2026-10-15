import { createHash } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { hashPassword } from '../lib/auth';
import { MembershipApplication } from '../models/MembershipApplication';
import { Member } from '../models/Member';
import { MemberInvite } from '../models/MemberInvite';
import { User } from '../models/User';

const applicationPayload = {
  fullName: 'Ayesha Hussain',
  studentId: 'LU-SSC-1042',
  department: 'Computer Science',
  semester: '4',
  universityEmail: 'ayesha@leads.edu.pk',
  phoneNumber: '+923001234567',
  areasOfInterest: ['Events', 'Community outreach'],
  motivationStatement: 'I want to help preserve Saraiki culture on campus.',
  preferredLanguage: 'skr',
  privacyAcknowledged: true,
};

describe('membership applications', () => {
  it('validates and persists a public application', async () => {
    const invalidResponse = await request(app)
      .post('/api/v1/membership/applications')
      .send({ ...applicationPayload, privacyAcknowledged: false });

    expect(invalidResponse.status).toBe(400);

    const response = await request(app)
      .post('/api/v1/membership/applications')
      .send(applicationPayload);
    const savedApplication = await MembershipApplication.findOne({ studentId: applicationPayload.studentId });

    expect(response.status).toBe(201);
    expect(response.body.data.application.status).toBe('pending');
    expect(savedApplication?.universityEmail).toBe(applicationPayload.universityEmail);
    expect(savedApplication?.preferredLanguage).toBe('skr');
  });

  it('prevents duplicate applications for a student ID', async () => {
    await request(app).post('/api/v1/membership/applications').send(applicationPayload);

    const duplicateResponse = await request(app)
      .post('/api/v1/membership/applications')
      .send({ ...applicationPayload, universityEmail: 'different@leads.edu.pk' });

    expect(duplicateResponse.status).toBe(409);
  });

  it('restricts the review queue and records one staff decision', async () => {
    const submission = await request(app)
      .post('/api/v1/membership/applications')
      .send(applicationPayload);
    const applicationId = submission.body.data.application.id as string;
    const password = 'StrongPassword123!';

    await User.create({ email: 'staff@example.com', passwordHash: await hashPassword(password), role: 'editor' });
    await User.create({ email: 'member@example.com', passwordHash: await hashPassword(password), role: 'member' });

    const anonymousQueue = await request(app).get('/api/v1/membership/applications');
    const memberLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@example.com', password });
    const memberQueue = await request(app)
      .get('/api/v1/membership/applications')
      .set('Cookie', memberLogin.headers['set-cookie'][0]);
    const staffLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@example.com', password });
    const staffCookie = staffLogin.headers['set-cookie'][0];
    const queue = await request(app)
      .get('/api/v1/membership/applications?status=pending')
      .set('Cookie', staffCookie);
    const missingReason = await request(app)
      .patch(`/api/v1/membership/applications/${applicationId}/review`)
      .set('Cookie', staffCookie)
      .send({ decision: 'rejected' });
    const decision = await request(app)
      .patch(`/api/v1/membership/applications/${applicationId}/review`)
      .set('Cookie', staffCookie)
      .send({ decision: 'rejected', rejectionReason: 'Please include your university email.' });
    const repeatedDecision = await request(app)
      .patch(`/api/v1/membership/applications/${applicationId}/review`)
      .set('Cookie', staffCookie)
      .send({ decision: 'approved' });

    expect(anonymousQueue.status).toBe(401);
    expect(memberQueue.status).toBe(403);
    expect(queue.status).toBe(200);
    expect(queue.body.data.applications).toHaveLength(1);
    expect(missingReason.status).toBe(400);
    expect(decision.status).toBe(200);
    expect(decision.body.data.application.status).toBe('rejected');
    expect(decision.body.data.application.rejectionReason).toBe('Please include your university email.');
    expect(decision.body.data.application.emailNotificationStatus).toBe('skipped');
    expect(repeatedDecision.status).toBe(409);
  });

  it('provisions a member after approval and activates access with a single-use link', async () => {
    const submission = await request(app)
      .post('/api/v1/membership/applications')
      .send(applicationPayload);
    const applicationId = submission.body.data.application.id as string;
    const password = 'StrongPassword123!';
    await User.create({ email: 'admin@example.com', passwordHash: await hashPassword(password), role: 'admin' });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@example.com', password });
    const staffCookie = staffLogin.headers['set-cookie'][0];

    const approval = await request(app)
      .patch(`/api/v1/membership/applications/${applicationId}/review`)
      .set('Cookie', staffCookie)
      .send({ decision: 'approved' });
    const memberUser = await User.findOne({ email: applicationPayload.universityEmail });
    const member = await Member.findOne({ studentId: applicationPayload.studentId });

    expect(approval.status).toBe(200);
    expect(approval.body.data.application.accountSetupStatus).toBe('pending');
    expect(approval.body.data.application.emailNotificationStatus).toBe('skipped');
    expect(memberUser?.role).toBe('member');
    expect(member?.fullName).toBe(applicationPayload.fullName);
    expect(await MemberInvite.countDocuments({ applicationId })).toBe(1);

    const activationToken = 'one-time-member-activation-token-which-is-long-enough';
    const tokenHash = createHash('sha256').update(activationToken).digest('hex');
    await MemberInvite.updateOne({ applicationId }, { $set: { tokenHash } });
    const activation = await request(app)
      .post('/api/v1/membership/setup-account')
      .send({ token: activationToken, password: 'NewMemberPassword123!' });
    const repeatedActivation = await request(app)
      .post('/api/v1/membership/setup-account')
      .send({ token: activationToken, password: 'AnotherPassword123!' });
    const memberLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: applicationPayload.universityEmail, password: 'NewMemberPassword123!' });
    const profile = await request(app)
      .get('/api/v1/members/me')
      .set('Cookie', memberLogin.headers['set-cookie'][0]);

    expect(activation.status).toBe(200);
    expect(repeatedActivation.status).toBe(400);
    expect(memberLogin.status).toBe(200);
    expect(profile.status).toBe(200);
    expect(profile.body.data.member.memberNumber).toMatch(/^SSC-/);
    expect((await MembershipApplication.findById(applicationId))?.accountSetupStatus).toBe('ready');
  });

  it('lists approved members with their application details for staff only', async () => {
    const submission = await request(app).post('/api/v1/membership/applications').send(applicationPayload);
    const applicationId = submission.body.data.application.id as string;
    const password = 'StrongPassword123!';
    await User.create({ email: 'admin@example.com', passwordHash: await hashPassword(password), role: 'admin' });
    const staffCookie = (await request(app).post('/api/v1/auth/login').send({ email: 'admin@example.com', password })).headers['set-cookie'][0];

    const anonymous = await request(app).get('/api/v1/membership/members');
    const emptyDirectory = await request(app).get('/api/v1/membership/members').set('Cookie', staffCookie);
    await request(app).patch(`/api/v1/membership/applications/${applicationId}/review`).set('Cookie', staffCookie).send({ decision: 'approved' });
    const directory = await request(app).get('/api/v1/membership/members').set('Cookie', staffCookie);

    expect(anonymous.status).toBe(401);
    expect(emptyDirectory.body.data.members).toHaveLength(0);
    expect(directory.status).toBe(200);
    expect(directory.body.data.members).toHaveLength(1);
    expect(directory.body.data.members[0]).toMatchObject({
      fullName: applicationPayload.fullName,
      studentId: applicationPayload.studentId,
      email: applicationPayload.universityEmail,
      phoneNumber: applicationPayload.phoneNumber,
      areasOfInterest: applicationPayload.areasOfInterest,
      accountSetupStatus: 'pending',
      eventRegistrations: 0,
    });
    expect(directory.body.data.members[0].memberNumber).toMatch(/^SSC-/);
  });
});