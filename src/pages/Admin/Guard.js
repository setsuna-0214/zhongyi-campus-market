import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';

const { Paragraph, Title } = Typography;

const AdminGuard = ({ children }) => {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem('adminVerified') === 'true';
    setVerified(flag);
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const expected = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
      if ((values.password || '').trim() === expected) {
        localStorage.setItem('adminVerified', 'true');
        setVerified(true);
        message.success('管理员验证通过');
      } else {
        message.error('验证密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return children;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
      <Card style={{ maxWidth: 420, width: '100%', borderRadius: 12 }}>
        <Title level={4} style={{ marginBottom: 8 }}>管理员验证</Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          进入管理员页面前，请输入验证密码。
        </Paragraph>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="password"
            label="验证密码"
            rules={[{ required: true, message: '请输入验证密码' }]}
          >
            <Input.Password placeholder="请输入管理员密码" autoFocus />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              验证并进入
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminGuard;