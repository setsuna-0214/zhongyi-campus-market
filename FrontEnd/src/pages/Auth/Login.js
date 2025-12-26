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
import { Link } from 'react-router-dom';
import './Auth.css';
import { login } from '../../api/auth';
import { setAuthUser } from '../../utils/auth';

const Login = () => {

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

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
      message.success('登录成功！');
      window.location.href = '/';
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
                className="auth-form"
              >
                <Form.Item
                  name="username"
                  label="用户名/邮箱"
                  rules={[
                    { required: true, message: '输入用户名或邮箱登录吧~' },
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
                    { required: true, message: '密码不能空着哦~' },
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