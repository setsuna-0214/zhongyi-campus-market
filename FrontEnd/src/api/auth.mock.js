/**
 * 认证 API - Mock 实现
 * 模拟登录、注册、验证码发送等功能
 */

import { mockUserDebug } from './mockData';

// 登录
export async function login({ username, email, password }) {
  const loginType = email ? '邮箱' : '用户名';
  const loginValue = email || username;

  // 快速登录：用户名/邮箱为1，密码为1
  if ((username === '1' || email === '1') && password === '1') {
    try {
      localStorage.setItem('authUser', JSON.stringify(mockUserDebug));
    } catch (e) {
      if (import.meta.env.DEV) console.warn('authUser 写入 localStorage 失败', e);
    }
    try {
      localStorage.setItem('authToken', mockUserDebug.token);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('authToken 写入 localStorage 失败', e);
    }
    return { code: 200, message: `登录成功（使用${loginType}登录）`, data: { token: mockUserDebug.token, user: mockUserDebug } };
  }
  if (loginValue && password) {
    return { code: 200, message: `登录成功（使用${loginType}登录）`, data: { token: mockUserDebug.token, user: mockUserDebug } };
  }
  throw new Error('登录失败：请检查用户名/邮箱和密码');
}

// 注册
export async function register(payload) {
  if (!payload?.username || !payload?.email || !payload?.password) {
    throw new Error('请填写完整的注册信息');
  }
  if (!payload?.verificationCode) {
    throw new Error('请输入验证码');
  }
  return { code: 200, message: '注册成功', data: { user: { ...mockUserDebug, nickname: payload?.nickname || mockUserDebug.nickname } } };
}

// 发送验证码
export async function sendCode({ email }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!email) {
    throw new Error('请输入邮箱地址');
  }
  return { code: 200, message: '验证码发送成功', data: {} };
}

// 忘记密码
export async function forgotPassword(payload) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (!payload?.verificationCode) {
    throw new Error('请输入验证码');
  }
  if (!payload?.newPassword) {
    throw new Error('请输入新密码');
  }
  return { code: 200, message: '密码重置成功', data: {} };
}

// 检查用户名是否已存在
export async function checkUsernameExists(username) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const existingUsernames = ['admin', 'test', 'student_01'];
  const exists = existingUsernames.includes(username?.toLowerCase());
  return { code: 200, data: { exists } };
}

// 检查邮箱是否已存在
export async function checkEmailExists(email) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const existingEmails = ['admin@example.com', 'test@example.com', 'zhangsan@example.com'];
  const exists = existingEmails.includes(email?.toLowerCase());
  return { code: 200, data: { exists } };
}
