import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Checkbox,
  message,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  WechatOutlined,
  QqOutlined,
  AlipayOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { login } from '../../api/auth';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await login({
        username: values.username,
        email: values.username, // 支持邮箱或用户名登录
        password: values.password,
      });
      if (res?.token) {
        localStorage.setItem('authToken', res.token);
      }
      if (res?.user) {
        localStorage.setItem('authUser', JSON.stringify(res.user));
      }
      message.success('登录成功！');
      window.location.href = '/';
    } catch (error) {
      message.error(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    message.info(`${platform}登录功能开发中...`);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>
      
      <div className="auth-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
          <Col xs={22} sm={16} md={12} lg={8} xl={6}>
            <Card className="auth-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <span className="logo-text">中易</span>
                </div>
                <Title level={2} className="auth-title">
                  欢迎回来
                </Title>
                <Text className="auth-subtitle">
                  登录您的校园二手交易账户
                </Text>
              </div>

              <div className="login-form-container">
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
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="请输入用户名或校园邮箱"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <div className="auth-options">
                    <Checkbox>记住我</Checkbox>
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

                <Divider>
                  <Text type="secondary">或者使用以下方式登录</Text>
                </Divider>

                <div className="social-login">
                  <Space size="large">
                  <Button 
                    icon={<WechatOutlined />} 
                    shape="circle" 
                    size="large"
                    className="social-button wechat"
                    onClick={() => handleSocialLogin('微信')}
                  />
                  <Button 
                    icon={<QqOutlined />} 
                    shape="circle" 
                    size="large"
                    className="social-button qq"
                    onClick={() => handleSocialLogin('QQ')}
                  />
                  <Button 
                    icon={<AlipayOutlined />} 
                    shape="circle" 
                    size="large"
                    className="social-button alipay"
                    onClick={() => handleSocialLogin('支付宝')}
                  />
                  </Space>
                </div>
              </div>

              <div className="auth-footer">
                <Text>
                  还没有账户？ 
                  <Link to="/register" className="auth-link">
                    立即注册
                  </Link>
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Login;