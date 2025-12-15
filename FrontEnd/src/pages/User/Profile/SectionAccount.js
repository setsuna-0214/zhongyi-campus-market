import React, { useState } from 'react';
import { Card, Row, Col, Space, Typography, Form, Input, Button, message } from 'antd';
import { sendCode } from '../../../api/auth';
import { requestEmailChange, confirmEmailChange, changePassword } from '../../../api/user';

const { Text } = Typography;

export default function SectionAccount({ userInfo, setUserInfo }) {
  const [emailForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [emailCodeLoading, setEmailCodeLoading] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [pwdCodeLoading, setPwdCodeLoading] = useState(false);
  const [pwdChanging, setPwdChanging] = useState(false);

  return (
    <Card className="section-card">
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Card type="inner" title="修改邮箱" size="small">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text>当前邮箱：{userInfo.email || '未绑定邮箱'}</Text>
              <Form form={emailForm} layout="vertical" initialValues={{ newEmail: '' }}>
                <Form.Item name="newEmail" label="新邮箱" rules={[{ required: true, message: '请输入新邮箱' }, { type: 'email', message: '邮箱格式不正确' }]} style={{ marginBottom: 12 }}>
                  <Input placeholder="请输入新邮箱" allowClear size="middle" />
                </Form.Item>
                <Form.Item label="验证码" style={{ marginBottom: 12 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="verificationCode" noStyle rules={[{ required: true, message: '请输入验证码' }]}> 
                      <Input placeholder="请输入收到的验证码" size="middle" />
                    </Form.Item>
                    <Button onClick={async () => {
                      try {
                        const { newEmail } = emailForm.getFieldsValue();
                        if (!newEmail) return;
                        setEmailCodeLoading(true);
                        const res = await sendCode({ email: newEmail });
                        if (res?.code !== 200) {
                          throw new Error(res?.message || '发送验证码失败');
                        }
                        await requestEmailChange({ newEmail });
                        message.success('验证码已发送');
                      } catch (error) {
                        message.error(error?.message || '发送验证码失败');
                      } finally {
                        setEmailCodeLoading(false);
                      }
                    }} loading={emailCodeLoading}>发送验证码</Button>
                  </Space.Compact>
                </Form.Item>
                <Button type="primary" onClick={async () => {
                  try {
                    const { newEmail, verificationCode } = await emailForm.validateFields();
                    setEmailChanging(true);
                    const resp = await confirmEmailChange({ newEmail, verificationCode });
                    if (resp?.success === false) {
                      throw new Error(resp?.message || '修改邮箱失败');
                    }
                    const nextEmail = newEmail || resp?.user?.email;
                    setUserInfo({ ...userInfo, email: nextEmail });
                    message.success('邮箱修改成功');
                    emailForm.resetFields();
                  } catch (error) {
                    message.error(error?.message || '修改邮箱失败');
                  } finally {
                    setEmailChanging(false);
                  }
                }} loading={emailChanging}>确认修改邮箱</Button>
              </Form>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card type="inner" title="修改密码" size="small">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Text type="secondary">需验证邮箱：{userInfo.email || '未绑定邮箱'}</Text>
              <Form form={pwdForm} layout="vertical">
                <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]} style={{ marginBottom: 12 }}>
                  <Input.Password placeholder="请输入当前密码" size="middle" />
                </Form.Item>
                <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6位' }]} style={{ marginBottom: 12 }}>
                  <Input.Password placeholder="请输入新密码" size="middle" />
                </Form.Item>
                <Form.Item name="confirmPassword" label="确认新密码" dependencies={["newPassword"]} rules={[({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) return Promise.resolve(); return Promise.reject(new Error('两次输入不一致')); } })]} style={{ marginBottom: 12 }}>
                  <Input.Password placeholder="请再次输入新密码" size="middle" />
                </Form.Item>
                <Form.Item label="验证码" style={{ marginBottom: 12 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="verificationCode" noStyle rules={[{ required: true, message: '请输入验证码' }]}> 
                      <Input placeholder="请输入验证码" size="middle" />
                    </Form.Item>
                    <Button onClick={async () => {
                      try {
                        if (!userInfo.email) {
                          message.error('请先绑定邮箱');
                          return;
                        }
                        setPwdCodeLoading(true);
                        const res = await sendCode({ email: userInfo.email });
                        if (res?.code !== 200) {
                          throw new Error(res?.message || '发送验证码失败');
                        }
                        message.success('验证码已发送');
                      } catch (error) {
                        message.error(error?.message || '发送验证码失败');
                      } finally {
                        setPwdCodeLoading(false);
                      }
                    }} loading={pwdCodeLoading}>发送验证码</Button>
                  </Space.Compact>
                </Form.Item>
                <Button type="primary" onClick={async () => {
                  try {
                    const { currentPassword, newPassword, confirmPassword, verificationCode } = await pwdForm.validateFields();
                    if (newPassword !== confirmPassword) {
                      message.error('两次输入的密码不一致');
                      return;
                    }
                    setPwdChanging(true);
                    const resp = await changePassword({ currentPassword, newPassword, verificationCode });
                    if (resp?.success === false) {
                      throw new Error(resp?.message || '修改密码失败');
                    }
                    message.success('密码修改成功');
                    pwdForm.resetFields(['currentPassword','newPassword','confirmPassword','verificationCode']);
                  } catch (error) {
                    message.error(error?.message || '修改密码失败');
                  } finally {
                    setPwdChanging(false);
                  }
                }} loading={pwdChanging}>确认修改密码</Button>
              </Form>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

