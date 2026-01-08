/**
 * 路由守卫组件
 * 提供统一的登录验证和角色权限检查
 */

import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn as checkIsLoggedIn, hasRole as checkHasRole } from '../../utils/auth';

export default function ProtectedRoute({ children, allowRoles, redirectTo = '/login', serverCheck }) {
  const location = useLocation();
  const [loading, setLoading] = useState(Boolean(serverCheck));
  const [serverOk, setServerOk] = useState(!serverCheck);

  // 本地校验：是否已登录、角色是否匹配
  const loggedIn = checkIsLoggedIn();
  const hasRole = !allowRoles || checkHasRole(allowRoles);

  // 后端校验（预留接口）
  useEffect(() => {
    let mounted = true;
    if (serverCheck) {
      (async () => {
        try {
          const ok = await serverCheck();
          if (mounted) setServerOk(Boolean(ok));
        } catch {
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
  if (!loggedIn || !hasRole || !serverOk) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // 通过：渲染受保护内容
  return children;
}
