import nodemailer, { type Transporter } from 'nodemailer';
import type { Locale } from '../../src/i18n/translations';
import type { MembershipStatus } from '../models/MembershipApplication.js';

type DecisionEmailInput = {
  email: string;
  fullName: string;
  decision: Extract<MembershipStatus, 'approved' | 'rejected'>;
  reason?: string;
  locale: Locale;
  setupUrl?: string;
};

type EmailTemplate = {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  label: string;
  reasonLabel: string;
  actionLabel: string;
  signoff: string;
  direction: 'ltr' | 'rtl';
};

const copy: Record<Locale, Record<'approved' | 'rejected', Omit<EmailTemplate, 'direction'>>> = {
  en: {
    approved: {
      subject: 'Welcome to the Saraiki Student Council',
      preheader: 'Your membership application has been approved.',
      heading: 'There is a place for your voice here.',
      paragraphs: ['We are delighted to let you know that your membership application has been approved.', 'Thank you for offering your time and energy to Saraiki culture and student life. A member of the council will be in touch with the next steps.'],
      label: 'Application approved',
      reasonLabel: 'A note from the council',
      actionLabel: 'Activate your member account',
      signoff: 'With warmth, The Saraiki Student Council',
    },
    rejected: {
      subject: 'An update on your council application',
      preheader: 'The council has reviewed your membership application.',
      heading: 'Thank you for putting yourself forward.',
      paragraphs: ['We appreciate the care and time you put into your application.', 'We are unable to offer membership at this time. Please read the note from the council below, and know that this decision does not diminish your connection to Saraiki culture or campus life.'],
      label: 'Application update',
      reasonLabel: 'A note from the council',
      actionLabel: 'Visit the council website',
      signoff: 'With respect, The Saraiki Student Council',
    },
  },
  ur: {
    approved: {
      subject: 'سرائیکی طلبہ کونسل میں خوش آمدید',
      preheader: 'آپ کی رکنیت کی درخواست منظور ہو گئی ہے۔',
      heading: 'کونسل میں آپ کی آواز کے لیے جگہ ہے۔',
      paragraphs: ['ہمیں خوشی ہے کہ آپ کی رکنیت کی درخواست منظور ہو گئی ہے۔', 'سرائیکی ثقافت اور طلبہ کی زندگی کے لیے اپنا وقت اور جذبہ دینے کا شکریہ۔ اگلے مراحل کے لیے کونسل کا رکن آپ سے رابطہ کرے گا۔'],
      label: 'درخواست منظور',
      reasonLabel: 'کونسل کی جانب سے پیغام',
      actionLabel: 'اپنا رکن اکاؤنٹ فعال کریں',
      signoff: 'نیک تمناؤں کے ساتھ، سرائیکی طلبہ کونسل',
    },
    rejected: {
      subject: 'کونسل کی درخواست کے بارے میں اطلاع',
      preheader: 'کونسل نے آپ کی رکنیت کی درخواست کا جائزہ لیا ہے۔',
      heading: 'درخواست دینے کا شکریہ۔',
      paragraphs: ['ہم آپ کی درخواست میں دیے گئے وقت اور توجہ کی قدر کرتے ہیں۔', 'فی الحال ہم رکنیت کی پیشکش نہیں کر سکتے۔ براہ کرم نیچے کونسل کا پیغام پڑھیں؛ یہ فیصلہ سرائیکی ثقافت یا جامعہ کی زندگی سے آپ کے تعلق کو کم نہیں کرتا۔'],
      label: 'درخواست کی تازہ صورت',
      reasonLabel: 'کونسل کی جانب سے پیغام',
      actionLabel: 'کونسل کی ویب سائٹ دیکھیں',
      signoff: 'احترام کے ساتھ، سرائیکی طلبہ کونسل',
    },
  },
  skr: {
    approved: {
      subject: 'سرائیکی طلبہ کونسل وچ خوش آمدید',
      preheader: 'تہاڈی رکنیت دی درخواست منظور تھی ڳئی اے۔',
      heading: 'کونسل وچ تہاڈی آواز دی تھاوے۔',
      paragraphs: ['ساݙے لئی خوشی دی ڳالھ اے جو تہاڈی رکنیت دی درخواست منظور تھی ڳئی اے۔', 'سرائیکی ثقافت تے طالب علمن دی زندگی واسطے اپنا وقت تے جذبہ ݙیوݨ دا شکریہ۔ اگلے مرحلیاں کیتے کونسل دا رکن تہاݙے نال رابطہ کریسے۔'],
      label: 'درخواست منظور',
      reasonLabel: 'کونسل ولوں پیغام',
      actionLabel: 'اپݨا رکن اکاؤنٹ فعال کرو',
      signoff: 'خلوص نال، سرائیکی طلبہ کونسل',
    },
    rejected: {
      subject: 'کونسل دی درخواست بارے اطلاع',
      preheader: 'کونسل تہاݙی رکنیت دی درخواست دا جائزہ گھدا اے۔',
      heading: 'درخواست ݙیوݨ دا شکریہ۔',
      paragraphs: ['اساں تہاݙی درخواست واسطے ݙتے ڳئے وقت تے توجہ دی قدر کریندے ہیں۔', 'ایں ویلے اساں رکنیت دی پیشکش نئیں کر سڳدے۔ ہیٹھاں کونسل دا پیغام پڑھو؛ ایہ فیصلہ سرائیکی ثقافت یا جامعہ دی زندگی نال تہاݙے تعلق کوں گھٹ نئیں کریندا۔'],
      label: 'درخواست دی تازہ صورت',
      reasonLabel: 'کونسل ولوں پیغام',
      actionLabel: 'کونسل دی ویب سائٹ ویکھو',
      signoff: 'احترام نال، سرائیکی طلبہ کونسل',
    },
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

export function createMembershipDecisionEmail(input: DecisionEmailInput) {
  const locale = input.locale in copy ? input.locale : 'en';
  const direction = locale === 'en' ? 'ltr' : 'rtl';
  const template = { ...copy[locale][input.decision], direction };
  const safeName = escapeHtml(input.fullName);
  const safeReason = input.reason ? escapeHtml(input.reason) : '';
  const paragraphsHtml = template.paragraphs.map((paragraph) => `<p style="margin:0 0 14px;color:#46534e;font-size:15px;line-height:1.8">${paragraph}</p>`).join('');
  const reasonHtml = safeReason
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:26px 0;background:#f7f3e9;border-${direction === 'rtl' ? 'right' : 'left'}:3px solid #b99a59"><tr><td style="padding:18px 20px"><div style="margin-bottom:8px;color:#8d7440;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${template.reasonLabel}</div><div style="color:#273630;font-size:14px;line-height:1.8">${safeReason}</div></td></tr></table>`
    : '';
  const safeSetupUrl = input.setupUrl ? escapeHtml(input.setupUrl) : '';
  const actionHtml = safeSetupUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0"><tr><td bgcolor="#173d35" style="background:#173d35"><a href="${safeSetupUrl}" style="display:inline-block;padding:14px 22px;color:#fff;font-size:13px;font-weight:bold;text-decoration:none">${template.actionLabel}</a></td></tr></table><p style="margin:0 0 18px;color:#68746f;font-size:12px;line-height:1.7">This secure link expires in 48 hours and can only be used once.</p>`
    : '';
  const subjectName = input.fullName.replace(/[\r\n]/g, ' ').trim();
  const subject = `${template.subject} | ${subjectName}`;
  const text = [
    template.heading,
    `Dear ${input.fullName},`,
    ...template.paragraphs,
    ...(input.reason ? [`${template.reasonLabel}: ${input.reason}`] : []),
    ...(input.setupUrl ? [`${template.actionLabel}: ${input.setupUrl}`, 'This secure link expires in 48 hours and can only be used once.'] : []),
    template.signoff,
    'Saraiki Student Council · Lahore Leads University',
  ].join('\n\n');

  const html = `<!doctype html><html lang="${locale}" dir="${direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:#f0eee8;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${template.preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0eee8"><tr><td align="center" style="padding:36px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff"><tr><td style="height:7px;background:#173d35;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="padding:28px 34px 24px;border-bottom:1px solid #e7e5df"><div style="color:#173d35;font-family:Georgia,serif;font-size:20px;font-weight:bold">Saraiki Student Council</div><div style="margin-top:5px;color:#8d7440;font-size:10px;letter-spacing:2px;text-transform:uppercase">Lahore Leads University</div></td></tr><tr><td style="padding:34px"><div style="display:inline-block;padding:8px 11px;background:${input.decision === 'approved' ? '#eaf2ec' : '#f7eeee'};color:${input.decision === 'approved' ? '#24543c' : '#762f40'};font-size:10px;font-weight:bold;letter-spacing:1.3px;text-transform:uppercase">${template.label}</div><h1 style="margin:20px 0 22px;color:#173d35;font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.25">${template.heading}</h1><p style="margin:0 0 16px;color:#273630;font-size:15px;line-height:1.7">${locale === 'en' ? `Dear ${safeName},` : `${safeName} عزیز،`}</p>${paragraphsHtml}${reasonHtml}${actionHtml}<p style="margin:28px 0 0;color:#273630;font-size:14px;line-height:1.8">${template.signoff.replace('The Saraiki Student Council', '<strong>The Saraiki Student Council</strong>').replace('سرائیکی طلبہ کونسل', '<strong>سرائیکی طلبہ کونسل</strong>')}</p></td></tr><tr><td style="padding:20px 34px;background:#173d35;color:#fff"><div style="font-family:Georgia,serif;font-size:15px">A living heritage. A shared future.</div><div style="margin-top:7px;color:#d9c99e;font-size:11px;line-height:1.6">Saraiki Student Council · Lahore Leads University<br>This message concerns your council membership application.</div></td></tr></table></td></tr></table></body></html>`;

  return { to: input.email, subject, text, html };
}

let transport: Transporter | undefined;

function getTransport() {
  if (transport) return transport;
  const host = process.env.SMTP_HOST ?? process.env.smtp_host;
  const port = Number(process.env.SMTP_PORT ?? process.env.smtp_port ?? 587);
  const user = process.env.SMTP_USER ?? process.env.smtp_user;
  const pass = process.env.SMTP_PASS ?? process.env.smtp_pass;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) return undefined;

  transport = nodemailer.createTransport({
    host,
    port,
    secure: (process.env.SMTP_SECURE ?? process.env.smtp_secure)?.toLowerCase() === 'true' || port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
  return transport;
}

export async function verifySmtpConnection() {
  const mailTransport = getTransport();
  if (!mailTransport) throw new Error('SMTP host or port is missing or invalid.');
  await mailTransport.verify();
}

export type EmailDeliveryStatus = 'sent' | 'failed' | 'skipped';

export async function sendMembershipDecisionEmail(input: DecisionEmailInput): Promise<EmailDeliveryStatus> {
  if (!input.email) return 'skipped';
  if (process.env.NODE_ENV === 'test') return 'skipped';

  const mailTransport = getTransport();
  if (!mailTransport) return 'failed';

  const user = process.env.SMTP_USER ?? process.env.smtp_user;
  const from = process.env.SMTP_FROM ?? process.env.smtp_from ?? user;
  if (!from) return 'failed';

  try {
    await mailTransport.sendMail({ from, ...createMembershipDecisionEmail(input) });
    return 'sent';
  } catch (error) {
    console.error('Membership decision email delivery failed.', error instanceof Error ? error.message : 'Unknown mail error');
    return 'failed';
  }
}

export async function sendCouncilContactEmail(input: { fullName: string; email: string; subject: string; message: string }): Promise<EmailDeliveryStatus> {
  if (process.env.NODE_ENV === 'test') return 'skipped';
  const mailTransport = getTransport();
  const user = process.env.SMTP_USER ?? process.env.smtp_user;
  const from = process.env.SMTP_FROM ?? process.env.smtp_from ?? user;
  const to = process.env.CONTACT_TO ?? process.env.contact_to ?? process.env.CONTACT_EMAIL ?? process.env.contact_email;
  if (!mailTransport || !from || !to) return 'failed';

  const safeName = escapeHtml(input.fullName);
  const safeEmail = escapeHtml(input.email);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replace(/\r?\n/g, '<br>');
  try {
    await mailTransport.sendMail({
      from,
      to,
      replyTo: input.email,
      subject: `[SSC website] ${input.subject.replace(/[\r\n]/g, ' ').trim()}`,
      text: `From: ${input.fullName} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`,
      html: `<!doctype html><html><body style="margin:0;padding:32px;background:#f0eee8;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:auto;background:#fff"><tr><td style="height:7px;background:#173d35"></td></tr><tr><td style="padding:28px 32px;border-bottom:1px solid #e7e5df"><strong style="color:#173d35;font-family:Georgia,serif;font-size:20px">Saraiki Student Council</strong><div style="margin-top:5px;color:#8d7440;font-size:10px;letter-spacing:2px">WEBSITE ENQUIRY</div></td></tr><tr><td style="padding:32px"><p style="color:#8d7440;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${safeSubject}</p><h1 style="color:#173d35;font-family:Georgia,serif;font-size:26px;font-weight:normal">A message from ${safeName}</h1><p style="color:#46534e;font-size:14px;line-height:1.7">Reply to: <a href="mailto:${safeEmail}" style="color:#762f40">${safeEmail}</a></p><div style="margin-top:24px;padding:20px;background:#f7f3e9;color:#273630;font-size:15px;line-height:1.8">${safeMessage}</div></td></tr><tr><td style="padding:18px 32px;background:#173d35;color:#d9c99e;font-size:11px">Saraiki Student Council · Lahore Leads University</td></tr></table></body></html>`,
    });
    return 'sent';
  } catch (error) {
    console.error('Council contact email delivery failed.', error instanceof Error ? error.message : 'Unknown mail error');
    return 'failed';
  }
}