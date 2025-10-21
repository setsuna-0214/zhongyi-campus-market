import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute
 * - 仅在前端提供统一的路由守卫接口
 * - 支持本地会话校验与可选的后端校验钩子（serverCheck）
 * - 未来接入后端鉴权时，只需在使用处传入 serverCheck 即可
 *
 * Props:
 * - children: 受保护的子组件
 * - allowRoles?: string[] 指定允许访问的角色（例如 ['admin']）
 * - redirectTo?: string 未通过验证时重定向路径（默认 '/login'）
 * - serverCheck?: () => Promise<boolean> 可选后端校验函数，返回 true/false
 */
export default function ProtectedRoute({ children, allowRoles, redirectTo = '/login', serverCheck }) {
  const location = useLocation();
  const [loading, setLoading] = useState(Boolean(serverCheck));
  const [serverOk, setServerOk] = useState(!serverCheck);

  // 本地校验：是否已登录、角色是否匹配
  const authUserRaw = localStorage.getItem('authUser');
  let authUser = null;
  try { authUser = authUserRaw ? JSON.parse(authUserRaw) : null; } catch (_) {}
  const isLoggedIn = Boolean(authUser);
  const hasRole = !allowRoles || (authUser && allowRoles.includes(authUser.role));

  // 可选：后端校验（预留接口）
  useEffect(() => {
    let mounted = true;
    if (serverCheck) {
      (async () => {
        try {
          const ok = await serverCheck();
          if (mounted) setServerOk(Boolean(ok));
        } catch (_) {
          if (mounted) setServerOk(false);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => { mounted = false; };
  }, [serverCheck]);

  // 加载中
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  // 未通过校验：未登录 或 角色不匹配 或 后端校验未通过
  if (!isLoggedIn || !hasRole || !serverOk) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // 通过：渲染受保护内容
  return children;
}