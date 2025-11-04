import client from './client';
import { mockUserDebug, isMockEnabled } from './mockData';

export async function login({ username, email, password }) {
  // 前端调试用户：用户名=1，密码=1 直接登录
  if ((username === '1' || email === '1') && password === '1') {
    try { localStorage.setItem('authUser', JSON.stringify(mockUserDebug)); } catch {}
    try { localStorage.setItem('authToken', mockUserDebug.token); } catch {}
    return { token: mockUserDebug.token, user: mockUserDebug };
  }

  // 后端未接入时使用 Mock
  if (isMockEnabled()) {
    // 简单模拟：用户名/邮箱非空且密码长度>=1 即视为通过
    if ((username || email) && password) {
      return { token: mockUserDebug.token, user: mockUserDebug };
    }
    throw new Error('登录失败：请检查用户名和密码');
  }

  // 否则走真实后端
  const payload = username ? { username, password } : { email, password };
  const { data } = await client.post('/auth/login', payload);
  return data; // 期望包含 { token, user }
}

export async function register(payload) {
  if (isMockEnabled()) {
    return { user: { ...mockUserDebug, name: payload?.name || mockUserDebug.name } };
  }
  const { data } = await client.post('/auth/register', payload);
  return data; // 期望包含 { user } 或 { message }
}