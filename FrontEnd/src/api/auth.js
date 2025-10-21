import client from './client';

export async function login({ username, email, password }) {
  const payload = username ? { username, password } : { email, password };
  const { data } = await client.post('/auth/login', payload);
  return data; // 期望包含 { token, user }
}

export async function register(payload) {
  const { data } = await client.post('/auth/register', payload);
  return data; // 期望包含 { user } 或 { message }
}