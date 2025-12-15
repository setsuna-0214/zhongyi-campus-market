import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { register, sendCode } from '../../api/auth';

const { Title, Text } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }
      setLoading(true);
      const res = await sendCode({ email });
      // 后端返回格式: { code: 200, message: "验证码发送成功", data: {} }
      if (res?.code !== 200) {
        throw new Error(res?.message || '发送验证码失败');
      }
      message.success('验证码已发送到您的邮箱');
      setCountdown(60);
    } catch (error) {
      message.error(error?.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        verificationCode: values.verificationCode,
      });
      // 后端返回格式: { code: 200, message: "注册成功", data: {} }
      if (res?.code !== 200) {
        throw new Error(res?.message || '注册失败');
      }
      message.success('注册成功！请登录您的账户');
      navigate('/login');
    } catch (error) {
      message.error(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => {
    return (
      <>
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名长度为3-20个字符' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: '密码必须包含大小写字母和数字',
            },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={["password"]}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
        </Form.Item>

        <Form.Item
          name="verificationCode"
          label="邮箱验证码"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <Row gutter={8}>
            <Col span={16}>
              <Input placeholder="请输入验证码" />
            </Col>
            <Col span={8}>
              <Button
                onClick={sendVerificationCode}
                loading={loading}
                disabled={countdown > 0}
                block
              >
                {countdown > 0 ? `重新发送(${countdown}s)` : '发送验证码'}
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </>
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>

      <div className="auth-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '12px 0' }}>
          <Col xs={22} sm={20} md={16} lg={12} xl={8}>
            <Card className="auth-card register-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <span className="logo-text">中易</span>
                </div>
                <Title level={2} className="auth-title">加入中易</Title>
                <Text className="auth-subtitle">创建您的中易账户</Text>
              </div>

              <Form
                form={form}
                name="register"
                onFinish={onFinish}
                layout="vertical"
                size="large"
                className="auth-form"
              >
                {renderFormContent()}

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="auth-button"
                    block
                  >
                    立即注册
                  </Button>
                </Form.Item>
              </Form>

              <div className="auth-footer">
                <Text>
                  已有账户？
                  <Link to="/login" className="auth-link">立即登录</Link>
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Register;