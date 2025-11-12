import client from './client';

export async function login({ username, email, password }) {
  const payload = username ? { username, password } : { email, password };
  const { data } = await client.post('/auth/login', payload);
  return data;
}

export async function register(payload) {
  const { data } = await client.post('/auth/register', payload);
  return data;
}

export async function sendCode({ email }) {
  const { data } = await client.post('/auth/send-code', { email });
  return data;
}

export async function forgotPassword({ username, email, verificationCode, newPassword, confirmPassword }) {
  const { data } = await client.post('/auth/forgot-password', {
    username,
    email,
    verificationCode,
    newPassword,
    confirmPassword,
  });
  return data;
}

