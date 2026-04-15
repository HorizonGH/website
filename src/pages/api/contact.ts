import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables explicitly
const envPath = process.cwd();
dotenv.config({ path: path.join(envPath, '.env.local') });
dotenv.config({ path: path.join(envPath, '.env') });

export const prerender = false;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildReturnUrl(referer: string | null, locale: string) {
  if (!referer) {
    return locale === 'es' ? '/es/?formStatus=success#contact' : '/?formStatus=success#contact';
  }

  try {
    const url = new URL(referer);
    url.searchParams.set('formStatus', 'success');
    url.hash = 'contact';
    return url.pathname + url.search + url.hash;
  } catch {
    return locale === 'es' ? '/es/?formStatus=success#contact' : '/?formStatus=success#contact';
  }
}

export const ALL: APIRoute = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read environment variables - now loaded via dotenv
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'horizon.gh.contact@gmail.com';
  const EMAIL_TO = process.env.EMAIL_TO || 'horizon.gh.contact@gmail.com';

  // Validate SMTP config
  if (!SMTP_USER || !SMTP_PASS) {
    return new Response(JSON.stringify({ error: 'SMTP configuration is missing. Check your environment variables.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create transporter inside function
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const topic = String(form.get('topic') ?? '').trim();
  const message = String(form.get('message') ?? '').trim();
  const locale = String(form.get('locale') ?? 'en');

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const subject = locale === 'es'
    ? 'Nuevo mensaje desde Horizon gh'
    : 'New message from Horizon gh';

  const html = `
    <h2>New contact request from Horizon gh</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Topic:</strong> ${escapeHtml(topic || 'Not provided')}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  const text = `New contact request from Horizon gh

Name: ${name}
Email: ${email}
Topic: ${topic || 'Not provided'}

Message:
${message}`;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: email,
      subject,
      text,
      html,
    });

    if (request.headers.get('accept')?.includes('application/json')) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const redirectUrl = buildReturnUrl(request.headers.get('referer'), locale);
    return new Response(null, {
      status: 303,
      headers: { Location: redirectUrl },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Unable to send message.', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
