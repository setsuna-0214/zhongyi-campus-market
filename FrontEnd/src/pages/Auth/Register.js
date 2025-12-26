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
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { register, sendCode, checkUsernameExists, checkEmailExists } from '../../api/auth';
import VerificationCodeInput from '../../components/VerificationCodeInput';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [countdown, setCountdown] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState({ validating: false, error: '' });
  const [emailStatus, setEmailStatus] = useState({ validating: false, error: '' });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 检查用户名是否已存在（防抖）
  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({ validating: false, error: '' });
      return;
    }
    // 验证格式：必须以字母开头，只能包含字母、数字、下划线和连字符
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
      setUsernameStatus({ validating: false, error: '' });
      return;
    }
    setUsernameStatus({ validating: true, error: '' });
    try {
      const res = await checkUsernameExists(username);
      if (res?.data?.exists) {
        setUsernameStatus({ validating: false, error: '该用户名已被注册' });
      } else {
        setUsernameStatus({ validating: false, error: '' });
      }
    } catch {
      setUsernameStatus({ validating: false, error: '' });
    }
  };

  // 检查邮箱是否已存在（防抖）
  const checkEmail = async (email) => {
    if (!email) {
      setEmailStatus({ validating: false, error: '' });
      return;
    }
    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus({ validating: false, error: '' });
      return;
    }
    setEmailStatus({ validating: true, error: '' });
    try {
      const res = await checkEmailExists(email);
      if (res?.data?.exists) {
        setEmailStatus({ validating: false, error: '该邮箱已被注册' });
      } else {
        setEmailStatus({ validating: false, error: '' });
      }
    } catch {
      setEmailStatus({ validating: false, error: '' });
    }
  };

  // 防抖处理
  const usernameTimerRef = React.useRef(null);
  const emailTimerRef = React.useRef(null);

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = setTimeout(() => checkUsername(value), 500);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    emailTimerRef.current = setTimeout(() => checkEmail(value), 500);
  };

  const sendVerificationCode = async () => {
    try {
      const username = form.getFieldValue('username');
      const email = form.getFieldValue('email');

      // 验证用户名
      if (!username) {
        message.error('请先输入用户名');
        return;
      }
      // 验证邮箱
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }
      // 检查是否有重复错误
      if (usernameStatus.error) {
        message.error(usernameStatus.error);
        return;
      }
      if (emailStatus.error) {
        message.error(emailStatus.error);
        return;
      }

      setLoading(true);

      // 发送验证码
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
          validateStatus={usernameStatus.validating ? 'validating' : (usernameStatus.error ? 'error' : undefined)}
          help={usernameStatus.error || undefined}
          hasFeedback={usernameStatus.validating || !!usernameStatus.error}
          rules={[
            { required: true, message: '用户名不能空着哦~' },
            { min: 3, max: 20, message: '用户名要3-20个字符才行呢' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: '用户名要以字母开头，只可以用字母、数字、下划线哦' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="给自己取个好记的名字吧"
            onChange={handleUsernameChange}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          validateStatus={emailStatus.validating ? 'validating' : (emailStatus.error ? 'error' : undefined)}
          help={emailStatus.error || undefined}
          hasFeedback={emailStatus.validating || !!emailStatus.error}
          rules={[
            { required: true, message: '邮箱是必填的哦~' },
            { type: 'email', message: '这个邮箱格式好像不太对' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="填写常用邮箱，用于接收验证码"
            onChange={handleEmailChange}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '设置一个密码吧~' },
            { min: 6, message: '密码太短啦，至少6位才安全' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: '密码要包含大小写字母和数字哦',
            },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="设置登录密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={["password"]}
          rules={[
            { required: true, message: '再输入一次密码确认下~' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次密码不一样，再检查下？'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" />
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
              onClick={sendVerificationCode}
              loading={loading}
              disabled={countdown > 0}
              className="verify-code-btn"
            >
              {countdown > 0 ? `${countdown}s` : '发送'}
            </Button>
          </div>
        </Form.Item>
      </>
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-background" />

      <div className="auth-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '12px 0' }}>
          <Col xs={22} sm={20} md={16} lg={12} xl={8}>
            <Card className="auth-card register-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <span className="logo-text">中易</span>
                </div>
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
                已有账户？
                <Link to="/login" className="auth-link">立即登录</Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Register;