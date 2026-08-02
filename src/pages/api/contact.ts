import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import 'dotenv/config';

// Use the RESEND_API_KEY environment variable for authentication.
// The `!` tells TypeScript we know the value will be defined at runtime.
const resend = new Resend(process.env.RESEND_API_KEY!);

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

  const EMAIL_FROM = import.meta.env.EMAIL_FROM;
  const EMAIL_TO = import.meta.env.EMAIL_TO;

if (!EMAIL_FROM || !EMAIL_TO) {
  return new Response(JSON.stringify({ error: 'Missing required email configuration (EMAIL_FROM or EMAIL_TO)' }), {
    status: 500,
  });
}

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

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: email,
      subject,
      html: `
        <h2>New contact request from Horizon gh</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(topic || 'Not provided')}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error(error);

      return new Response(
        JSON.stringify({
          error: 'Unable to send email',
        }),
        { status: 500 }
      );
    }

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
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
      }),
      { status: 500 }
    );
  }
};
