import { describe, expect, it } from 'vitest';
import { createMembershipDecisionEmail, sendMembershipDecisionEmail } from '../lib/membershipEmail';

describe('membership decision email templates', () => {
  it('creates a branded approval email with HTML and plain-text alternatives', () => {
    const message = createMembershipDecisionEmail({
      email: 'student@leads.edu.pk',
      fullName: 'Ayesha Hussain',
      decision: 'approved',
      locale: 'en',
    });

    expect(message.to).toBe('student@leads.edu.pk');
    expect(message.subject).toContain('Welcome to the Saraiki Student Council');
    expect(message.html).toContain('Application approved');
    expect(message.html).toContain('A living heritage. A shared future.');
    expect(message.text).toContain('A member of the council will be in touch');
  });

  it('localizes declined notices and escapes applicant-provided reason text', () => {
    const message = createMembershipDecisionEmail({
      email: 'student@leads.edu.pk',
      fullName: '<img src=x onerror=alert(1)>',
      decision: 'rejected',
      reason: '<script>alert("x")</script>',
      locale: 'ur',
    });

    expect(message.html).toContain('dir="rtl"');
    expect(message.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(message.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(message.html).not.toContain('<script>alert');
    expect(message.text).toContain('<script>alert("x")</script>');
  });

  it('includes the secure activation action in approved-member email', () => {
    const message = createMembershipDecisionEmail({
      email: 'student@leads.edu.pk',
      fullName: 'Ayesha Hussain',
      decision: 'approved',
      locale: 'en',
      setupUrl: 'https://ssc.example/member/setup?token=secure-value',
    });

    expect(message.html).toContain('Activate your member account');
    expect(message.html).toContain('https://ssc.example/member/setup?token=secure-value');
    expect(message.text).toContain('expires in 48 hours');
  });

  it('shows the member number and the council emblem when they are known', () => {
    const message = createMembershipDecisionEmail({
      email: 'student@leads.edu.pk',
      fullName: 'Ayesha Hussain',
      decision: 'approved',
      locale: 'en',
      memberNumber: 'SSC-2026-ABC123',
      appUrl: 'https://ssc.example/',
    });

    expect(message.html).toContain('SSC-2026-ABC123');
    expect(message.html).toContain('https://ssc.example/email-logo.png');
    expect(message.text).toContain('Your member number: SSC-2026-ABC123');
  });

  it('skips delivery safely when no applicant email is available', async () => {
    await expect(sendMembershipDecisionEmail({
      email: '',
      fullName: 'Student',
      decision: 'approved',
      locale: 'en',
    })).resolves.toBe('skipped');
  });
});