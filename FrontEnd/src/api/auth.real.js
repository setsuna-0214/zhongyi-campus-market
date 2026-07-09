/**
 * 认证 API - 真实后端实现
 * 调用后端 REST API 处理用户认证
 */

import client from './client';

// 登录
export async function login({ username, email, password }) {
  const payload = { password };
  if (username) payload.username = username;
  if (email) payload.email = email;
  const { data } = await client.post('/auth/login', payload);
  return data;
}

// 注册
export async function register(payload) {
  const { data } = await client.post('/auth/register', payload);
  return data;
}

// 发送验证码
export async function sendCode({ email }) {
  const { data } = await client.post('/auth/send-code', { email });
  return data;
}

// 忘记密码
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
