import { mockUserDebug } from './mockData';

export async function login({ username, email, password }) {
  // 判断登录方式：用户名或邮箱
  const loginType = email ? '邮箱' : '用户名';
  const loginValue = email || username;
  
  // 快速登录：用户名/邮箱为1，密码为1
  if ((username === '1' || email === '1') && password === '1') {
    try { localStorage.setItem('authUser', JSON.stringify(mockUserDebug)); } catch {}
    try { localStorage.setItem('authToken', mockUserDebug.token); } catch {}
    return { code: 200, message: `登录成功（使用${loginType}登录）`, data: { token: mockUserDebug.token, user: mockUserDebug } };
  }
  if (loginValue && password) {
    return { code: 200, message: `登录成功（使用${loginType}登录）`, data: { token: mockUserDebug.token, user: mockUserDebug } };
  }
  throw new Error('登录失败：请检查用户名/邮箱和密码');
}

export async function register(payload) {
  // 模拟验证
  if (!payload?.username || !payload?.email || !payload?.password) {
    throw new Error('请填写完整的注册信息');
  }
  if (!payload?.verificationCode) {
    throw new Error('请输入验证码');
  }
  return { code: 200, message: '注册成功', data: { user: { ...mockUserDebug, nickname: payload?.nickname || mockUserDebug.nickname } } };
}

export async function sendCode({ email }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!email) {
    throw new Error('请输入邮箱地址');
  }
  return { code: 200, message: '验证码发送成功', data: {} };
}

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
  // Mock模式下，假设 "admin" 和 "test" 用户名已存在
  const existingUsernames = ['admin', 'test', 'student_01'];
  const exists = existingUsernames.includes(username?.toLowerCase());
  return { code: 200, data: { exists } };
}

// 检查邮箱是否已存在
export async function checkEmailExists(email) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  // Mock模式下，假设这些邮箱已存在
  const existingEmails = ['admin@example.com', 'test@example.com', 'zhangsan@example.com'];
  const exists = existingEmails.includes(email?.toLowerCase());
  return { code: 200, data: { exists } };
}

