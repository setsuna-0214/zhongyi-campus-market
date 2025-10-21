import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Select,
  message,
  Row,
  Col,
  Checkbox
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { register } from '../../api/auth';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();
  const [verificationSent, setVerificationSent] = useState(false);

  const schools = [
    '北京大学',
    '清华大学',
    '复旦大学',
    '上海交通大学',
    '浙江大学',
    '南京大学',
    '中山大学',
    '华中科技大学',
    '西安交通大学',
    '哈尔滨工业大学'
  ];





  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }
      
      setLoading(true);
      // 模拟发送验证码
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerificationSent(true);
      message.success('验证码已发送到您的邮箱');
    } catch (error) {
      message.error('发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        phone: values.phone,
        studentId: values.studentId,
        school: values.school,
      });
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
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="请输入用户名"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="校园邮箱"
          rules={[
            { required: true, message: '请输入校园邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
            { pattern: /\.edu\.cn$/, message: '请使用校园邮箱（以.edu.cn结尾）' }
          ]}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="请输入校园邮箱"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码必须包含大小写字母和数字' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="请输入密码"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={['password']}
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
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="请再次输入密码"
          />
        </Form.Item>

        <Form.Item
          name="school"
          label="所在学校"
          rules={[{ required: true, message: '请选择您的学校' }]}
        >
          <Select 
            placeholder="请选择您的学校"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {schools.map(school => (
              <Option key={school} value={school}>{school}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="studentId"
          label="学号"
          rules={[
            { required: true, message: '请输入学号' },
            { pattern: /^\d{8,12}$/, message: '学号应为8-12位数字' }
          ]}
        >
          <Input 
            prefix={<IdcardOutlined />} 
            placeholder="请输入学号"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号码"
          rules={[
            { required: true, message: '请输入手机号码' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
          ]}
        >
          <Input 
            prefix={<PhoneOutlined />} 
            placeholder="请输入手机号码"
          />
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
                disabled={verificationSent}
                block
              >
                {verificationSent ? '已发送' : '发送验证码'}
              </Button>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          name="realName"
          label="真实姓名"
          rules={[
            { required: true, message: '请输入真实姓名' },
            { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '请输入2-10个中文字符' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="请输入真实姓名"
          />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            { 
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('请同意用户协议和隐私政策'))
            }
          ]}
        >
          <Checkbox>
            我已阅读并同意 
            <Link to="/terms" target="_blank">《用户协议》</Link> 
            和 
            <Link to="/privacy" target="_blank">《隐私政策》</Link>
          </Checkbox>
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
        <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '20px 0' }}>
          <Col xs={22} sm={20} md={16} lg={12} xl={8}>
            <Card className="auth-card register-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <span className="logo-text">中易</span>
                </div>
                <Title level={2} className="auth-title">
                  加入中易
                </Title>
                <Text className="auth-subtitle">
                  创建您的校园二手交易账户
                </Text>
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
                    完成注册
                  </Button>
                </Form.Item>
              </Form>

              <div className="auth-footer">
                <Text>
                  已有账户？ 
                  <Link to="/login" className="auth-link">
                    立即登录
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

export default Register;