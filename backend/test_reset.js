const http = require('http');

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

async function test() {
  try {
    // 1. Log in
    const loginRes = await post('http://localhost:3000/api/v1/auth/login', {
      email: 'collab1@tms.com',
      password: 'Collab@123!'
    });
    console.log('Login response status:', loginRes.status);
    const token = loginRes.data.token;
    console.log('Token:', token ? 'YES' : 'NO');

    if (!token) {
      console.log('Login failed:', loginRes.data);
      return;
    }

    // 2. Call reset-password
    const resetRes = await post(
      'http://localhost:3000/api/v1/auth/reset-password',
      { newPassword: 'NewPassword@123!' },
      { Authorization: `Bearer ${token}` }
    );
    console.log('Reset password status:', resetRes.status);
    console.log('Reset password data:', resetRes.data || resetRes.raw);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();
