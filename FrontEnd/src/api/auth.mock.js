import { mockUserDebug } from './mockData';

export async function login({ username, email, password }) {
  if ((username === '1' || email === '1') && password === '1') {
    try { localStorage.setItem('authUser', JSON.stringify(mockUserDebug)); } catch {}
    try { localStorage.setItem('authToken', mockUserDebug.token); } catch {}
    return { token: mockUserDebug.token, user: mockUserDebug };
  }
  if ((username || email) && password) {
    return { token: mockUserDebug.token, user: mockUserDebug };
  }
  throw new Error('登录失败：请检查用户名和密码');
}

export async function register(payload) {
  return { user: { ...mockUserDebug, name: payload?.name || mockUserDebug.name } };
}

export async function sendCode() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { message: '验证码发送成功' };
}

export async function forgotPassword() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { message: '密码重置成功' };
}

