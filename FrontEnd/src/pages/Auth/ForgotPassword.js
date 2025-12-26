import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Row,
  Col,
} from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { sendCode, forgotPassword } from '../../api/auth';
import VerificationCodeInput from '../../components/VerificationCodeInput';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
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
      message.error(error?.message || '发送验证码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      const res = await forgotPassword({
        username: values.username,
        email: values.email,
        verificationCode: values.verificationCode,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      // 后端返回格式: { code: 200, message: "密码重置成功", data: {} }
      if (res?.code !== 200) {
        throw new Error(res?.message || '重置密码失败');
      }
      message.success('密码重置成功！请使用新密码登录');
      navigate('/login');
    } catch (error) {
      message.error(error?.message || '重置密码失败，请重试');
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
                name="forgot-password"
                onFinish={onFinish}
                layout="vertical"
                size="large"
                className="auth-form"
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '先告诉我你的用户名~' },
                    { min: 3, max: 20, message: '用户名是3-20个字符哦' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能是字母、数字和下划线' },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="输入你的用户名" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '填写注册时用的邮箱~' },
                    { type: 'email', message: '邮箱格式好像不太对' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="注册时使用的邮箱" />
                </Form.Item>

                <Form.Item
                  name="verificationCode"
                  label="邮箱验证码"
                  rules={[
                    { required: true, message: '验证码不能少~' },
                    { len: 6, message: '验证码是6位数字哦' },
                  ]}
                >
                  <div className="verification-code-row">
                    <VerificationCodeInput />
                    <Button
                      onClick={handleSendCode}
                      loading={loading}
                      disabled={countdown > 0}
                      className="verify-code-btn"
                    >
                      {countdown > 0 ? `${countdown}s` : '发送'}
                    </Button>
                  </div>
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="新密码"
                  rules={[
                    { required: true, message: '设置一个新密码吧~' },
                    { min: 6, message: '密码太短啦，至少6位才安全' },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="设置新密码" autoComplete="new-password" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: '再输入一次确认下~' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次密码不一样，再检查下？'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" autoComplete="new-password" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} className="auth-button" block>
                    重置密码
                  </Button>
                </Form.Item>
              </Form>

              <div className="auth-footer">
                想起密码了？
                <Link to="/login" className="auth-link">返回登录</Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ForgotPassword;