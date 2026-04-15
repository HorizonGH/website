// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 3000));

const formData = new URLSearchParams({
  name: 'Test User',
  email: 'test@example.com',
  message: 'This is a test message',
  locale: 'en',
  scope: 'general'
});

try {
  const response = await fetch('http://localhost:4323/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
    redirect: 'manual'
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers));
  
  if (response.status === 303) {
    console.log('✓ Email sent successfully! Redirecting to:', response.headers.get('location'));
  } else {
    const text = await response.text();
    console.log('Response:', text);
  }
} catch (error) {
  console.error('Error:', error.message);
}

process.exit(0);
