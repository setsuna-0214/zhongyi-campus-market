import client from './client';

export async function login({ username, email, password }) {
  // 根据传入的参数构建请求体，只发送有值的字段
  const payload = { password };
  if (username) payload.username = username;
  if (email) payload.email = email;
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

// 检查用户名是否已存在
export async function checkUsernameExists(username) {
  const { data } = await client.get('/auth/check-username', { params: { username } });
  return data;
}

// 检查邮箱是否已存在
export async function checkEmailExists(email) {
  const { data } = await client.get('/auth/check-email', { params: { email } });
  return data;
}

