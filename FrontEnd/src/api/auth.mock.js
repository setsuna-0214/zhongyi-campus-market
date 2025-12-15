import { mockUserDebug } from './mockData';

export async function login({ username, email, password }) {
  if ((username === '1' || email === '1') && password === '1') {
    try { localStorage.setItem('authUser', JSON.stringify(mockUserDebug)); } catch {}
    try { localStorage.setItem('authToken', mockUserDebug.token); } catch {}
    return { code: 200, message: '登录成功', data: { token: mockUserDebug.token, user: mockUserDebug } };
  }
  if ((username || email) && password) {
    return { code: 200, message: '登录成功', data: { token: mockUserDebug.token, user: mockUserDebug } };
  }
  throw new Error('登录失败：请检查用户名和密码');
}

export async function register(payload) {
  // 模拟验证
  if (!payload?.username || !payload?.email || !payload?.password) {
    throw new Error('请填写完整的注册信息');
  }
  if (!payload?.verificationCode) {
    throw new Error('请输入验证码');
  }
  return { code: 200, message: '注册成功', data: { user: { ...mockUserDebug, name: payload?.name || mockUserDebug.name } } };
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

