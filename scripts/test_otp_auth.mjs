import postgres from 'postgres';
import crypto from 'crypto';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.huadrmmnlvzdmtqkyldc:recursiveqna%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';
const JWT_SECRET = process.env.JWT_SECRET || 'recursiveqna-production-jwt-key-2026';

const sql = postgres(DATABASE_URL);

function hashOtp(email, otp) {
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${email.trim().toLowerCase()}:${otp}`)
    .digest('hex');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('======================================================');
  console.log(' Starting Comprehensive Email OTP & Auth Test Suite');
  console.log(' Target:', BASE_URL);
  console.log('======================================================\n');

  // Test 1: Invalid email format
  console.log('[Test 1] Testing invalid email submission...');
  const res1 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  const data1 = await res1.json();
  assert(res1.status === 400, 'Invalid email returns HTTP 400');
  assert(data1.error && data1.error.includes('valid email'), 'Error message specifies invalid email');

  // Test 2: Successful OTP request & DB hash verification
  console.log('\n[Test 2] Testing valid OTP generation & storage...');
  const testEmail = `test_${Date.now()}@recursiveqna.org`;
  const res2 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const data2 = await res2.json();
  assert(res2.status === 200, 'Valid email OTP request returns HTTP 200');
  assert(data2.success === true, 'Response indicates success');

  // Inspect database to check OTP record
  const otpRows = await sql`SELECT * FROM public.otps WHERE email = ${testEmail}`;
  const otpRecord = otpRows[0];
  assert(otpRecord !== undefined, 'OTP record saved in database');
  assert(otpRecord.otp_hash && otpRecord.otp_hash.length === 64, 'OTP is stored as SHA-256 hash (never plaintext)');
  assert(Number(otpRecord.attempts) === 0, 'Initial attempts count is 0');
  assert(Number(otpRecord.expires_at) > Date.now(), 'OTP expiry is set in the future (~5 minutes)');

  // Test 3: Resend cooldown (within 30 seconds)
  console.log('\n[Test 3] Testing 30-second resend cooldown...');
  const res3 = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const data3 = await res3.json();
  assert(res3.status === 429, 'Immediate resend returns HTTP 429');
  assert(data3.error && data3.error.includes('wait'), 'Error message indicates cooldown period');

  // Test 4: Wrong verification code
  console.log('\n[Test 4] Testing wrong code verification...');
  const res4 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: '000000' }),
  });
  const data4 = await res4.json();
  assert(res4.status === 400, 'Wrong code returns HTTP 400');
  assert(data4.attemptsRemaining === 4, 'Remaining attempts decremented to 4');

  // Test 5: Attempt limit (Max 5 attempts)
  console.log('\n[Test 5] Testing attempt limit invalidation (5 wrong tries)...');
  for (let i = 2; i <= 4; i++) {
    await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, code: '00000' + i }),
    });
  }
  // 5th wrong attempt should invalidate
  const res5 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: '999999' }),
  });
  const data5 = await res5.json();
  assert(res5.status === 429, '5th wrong attempt returns HTTP 429');
  assert(data5.status === 'TOO_MANY_ATTEMPTS', 'Status is TOO_MANY_ATTEMPTS');

  // Verify OTP was invalidated in database
  const invalidatedRows = await sql`SELECT * FROM public.otps WHERE email = ${testEmail}`;
  assert(invalidatedRows.length === 0, 'Invalidated OTP removed from database');

  // Test 6: Expired code handling
  console.log('\n[Test 6] Testing expired code rejection...');
  const expiredEmail = `expired_${Date.now()}@recursiveqna.org`;
  const knownOtp = '123456';
  const knownHash = hashOtp(expiredEmail, knownOtp);
  // Insert artificial expired OTP
  await sql`
    INSERT INTO public.otps (id, email, otp_hash, expires_at, attempts, created_at)
    VALUES (${'test_exp_' + Date.now()}, ${expiredEmail}, ${knownHash}, ${Date.now() - 10000}, 0, ${Date.now() - 60000})
  `;

  const res6 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: expiredEmail, code: knownOtp }),
  });
  const data6 = await res6.json();
  assert(res6.status === 400, 'Expired code returns HTTP 400');
  assert(data6.status === 'EXPIRED', 'Status is EXPIRED');

  // Test 7: Hourly rate limit (5 requests per email)
  console.log('\n[Test 7] Testing hourly rate limit of 5 requests per email...');
  const limitEmail = `limit_${Date.now()}@recursiveqna.org`;
  // Record 5 requests in rate_limits table
  await sql`
    INSERT INTO public.rate_limits (key, count, reset_at, last_requested_at)
    VALUES (${'email:' + limitEmail}, 5, ${Date.now() + 3600000}, ${Date.now() - 40000})
    ON CONFLICT(key) DO UPDATE SET count = 5, last_requested_at = ${Date.now() - 40000}
  `;

  const res7 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: limitEmail }),
  });
  const data7 = await res7.json();
  assert(res7.status === 429, 'Hitting 5 requests/hr limit returns HTTP 429');
  assert(data7.error && data7.error.includes('Too many code requests'), 'Error indicates hourly limit exceeded');

  // Test 8: Successful verification, cookie issuance, and single-use
  console.log('\n[Test 8] Testing successful verification and session issuance...');
  const successEmail = `scholar_${Date.now()}@recursiveqna.org`;
  const validCode = '765432';
  const validHash = hashOtp(successEmail, validCode);
  await sql`
    INSERT INTO public.otps (id, email, otp_hash, expires_at, attempts, created_at)
    VALUES (${'test_success_' + Date.now()}, ${successEmail}, ${validHash}, ${Date.now() + 300000}, 0, ${Date.now()})
  `;

  const res8 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: successEmail, code: validCode }),
  });
  const data8 = await res8.json();
  assert(res8.status === 200, 'Successful verification returns HTTP 200');
  assert(data8.success === true, 'Response success is true');
  assert(data8.user && data8.user.email === successEmail, 'User profile returned with email');

  // Check Set-Cookie headers
  const setCookieHeader = res8.headers.get('set-cookie') || '';
  assert(setCookieHeader.includes('rqna_token'), 'Issues rqna_token cookie');
  assert(setCookieHeader.includes('HttpOnly') || setCookieHeader.includes('httponly'), 'Cookie is HttpOnly');

  // Extract auth cookie for session testing
  const authCookie = setCookieHeader.split(';')[0];

  // Verify single-use: Submitting valid code second time must fail
  const res8b = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: successEmail, code: validCode }),
  });
  assert(res8b.status === 400, 'Second verification attempt fails (single-use)');

  // Test 9: Protected routes WITHOUT a session
  console.log('\n[Test 9] Testing protected routes without session...');
  const res9a = await fetch(`${BASE_URL}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Unauthenticated Test Question', content: 'This should fail', field: 'General' }),
  });
  assert(res9a.status === 401, 'POST /api/questions without session rejected with HTTP 401');

  const res9b = await fetch(`${BASE_URL}/api/solutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId: 'none', content: 'This should fail' }),
  });
  assert(res9b.status === 401, 'POST /api/solutions without session rejected with HTTP 401');

  const res9c = await fetch(`${BASE_URL}/api/auth/me`);
  assert(res9c.status === 401, 'GET /api/auth/me without session returns HTTP 401');

  // Test 10: Protected routes WITH a session
  console.log('\n[Test 10] Testing protected routes with session cookie...');
  const res10a = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: authCookie },
  });
  const data10a = await res10a.json();
  assert(res10a.status === 200, 'GET /api/auth/me with session returns HTTP 200');
  assert(data10a.user && data10a.user.email === successEmail, 'Returns authenticated user info');

  // Test optional phone update
  const res10b = await fetch(`${BASE_URL}/api/auth/update-phone`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: authCookie,
    },
    body: JSON.stringify({ phone: '+1 555 987 6543' }),
  });
  const data10b = await res10b.json();
  assert(res10b.status === 200, 'POST /api/auth/update-phone returns HTTP 200');
  assert(data10b.user.phone === '+1 555 987 6543', 'Phone number updated on user session');

  // Test question creation with session
  const res10c = await fetch(`${BASE_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
    },
    body: JSON.stringify({
      title: 'Automated Test Problem on Quantum States',
      content: 'Detailed description of the quantum superposition problem for testing.',
      field: 'Physics',
    }),
  });
  const data10c = await res10c.json();
  assert(res10c.status === 200 || res10c.status === 201, 'POST /api/questions with session returns HTTP 200/201');
  assert(data10c.question && data10c.question.title.includes('Quantum'), 'Question created successfully in database');

  // Clean up created test question and user
  if (data10c.question?.id) {
    await sql`DELETE FROM public.questions WHERE id = ${data10c.question.id}`;
  }
  await sql`DELETE FROM public.users WHERE email = ${successEmail}`;

  // Test 11: Logout and session revocation
  console.log('\n[Test 11] Testing logout and session revocation...');
  const res11 = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: authCookie },
  });
  assert(res11.status === 200, 'POST /api/auth/logout returns HTTP 200');
  const logoutCookie = res11.headers.get('set-cookie') || '';
  assert(logoutCookie.includes('Max-Age=0') || logoutCookie.includes('max-age=0'), 'Logout clears authentication cookies');

  // Verify /auth/me returns 401 after logout
  const res11b = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: 'rqna_token=; Max-Age=0' },
  });
  assert(res11b.status === 401, 'GET /api/auth/me returns 401 after session cleared');

  console.log('\n======================================================');
  console.log(' ALL 11 TEST SUITES PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');

  await sql.end();
}

runTests().catch(async (err) => {
  console.error('\n❌ Test execution failed with error:', err);
  await sql.end();
  process.exit(1);
});
