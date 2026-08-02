import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

// Resolve the Resend API key at runtime from the Worker's bindings.
// Astro inlines `import.meta.env.*` at build time, which breaks secrets that the
// CI build server may not have in its local `.env`. Reading via `locals.runtime.env`
// guarantees we use the live secret/binding instead.
function getResendApiKey(locals: any): string {
  const fromRuntime = locals?.runtime?.env?.RESEND_API_KEY;
  if (typeof fromRuntime === 'string' && fromRuntime.length > 0) {
    return fromRuntime;
  }
  // Fallback to build-time env in local development.
  const fromEnv = import.meta.env.RESEND_API_KEY;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  return '';
}

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

export const ALL: APIRoute = async ({ request, locals }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const runtimeEnv = (locals as any)?.runtime?.env as
    | Record<string, string | undefined>
    | undefined;

  // Read config from the live Worker bindings first; fallback to build-time env.
  const EMAIL_FROM =
    runtimeEnv?.EMAIL_FROM ?? (import.meta.env.EMAIL_FROM as string | undefined);
  const EMAIL_TO =
    runtimeEnv?.EMAIL_TO ?? (import.meta.env.EMAIL_TO as string | undefined);

  if (!EMAIL_FROM || !EMAIL_TO) {
    return new Response(JSON.stringify({ error: 'Missing required email configuration (EMAIL_FROM or EMAIL_TO)' }), {
      status: 500,
    });
  }

  const apiKey = getResendApiKey(locals);
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Resend API key configuration' }),
      { status: 500 }
    );
  }
  const resend = new Resend(apiKey);

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
