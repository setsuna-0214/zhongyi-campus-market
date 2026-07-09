/**
 * 登录页面
 * 提供用户名/邮箱登录功能，包含登录表单和跳转注册/找回密码入口
 */

import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  LockOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import './Auth.css';
import '../../styles/form.css';
import { login } from '../../api/auth';
import { setAuthUser } from '../../utils/auth';

function sanitizeRedirectPath(path) {
  if (!path || typeof path !== 'string') return '/';
  if (path.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return '/';
  if (!path.startsWith('/')) return '/';
  return path;
}

const Login = () => {

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const location = useLocation();

  // 判断输入是否为邮箱格式
  const isEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const input = values.username?.trim();
      // 根据输入格式判断是用户名还是邮箱
      const loginPayload = isEmail(input)
        ? { email: input, password: values.password }
        : { username: input, password: values.password };

      const res = await login(loginPayload);

      // 后端返回格式: { code: 200, message: "登录成功", data: { token, user } }
      if (res?.code !== 200) {
        throw new Error(res?.message || '登录失败');
      }

      const { token, user } = res.data || {};
      setAuthUser(user, token);
      message.success('登录成功');

      const fromState = location.state?.from;
      const fromStatePath = fromState ? `${fromState.pathname || ''}${fromState.search || ''}${fromState.hash || ''}` : '';
      const fromSession = sessionStorage.getItem('loginRedirect') || '';
      sessionStorage.removeItem('loginRedirect');

      const redirectTo = sanitizeRedirectPath(fromStatePath || fromSession || '/');
      window.location.href = redirectTo;
    } catch (error) {
      message.error(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-background" />

      <div className="auth-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '12px 0' }}>
          <Col xs={22} sm={20} md={16} lg={12} xl={8}>
            <Card className="auth-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <span className="logo-text">中易</span>
                </div>
              </div>

              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
                className="auth-form form-input-style"
              >
                <Form.Item
                  name="username"
                  label="用户名/邮箱"
                  rules={[
                    { required: true, message: '请输入用户名或邮箱' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名或邮箱"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="输入密码"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <div className="auth-options">
                    <Link to="/forgot-password" className="forgot-link">
                      忘记密码？
                    </Link>
                  </div>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="auth-button"
                    block
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>

              <div className="auth-footer">
                还没有账户？
                <Link to="/register" className="auth-link">
                  立即注册
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Login;
