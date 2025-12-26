import React, { useState, useEffect, useCallback } from 'react';
import { Card, Space, Typography, Form, Input, Button, message, Modal, Alert } from 'antd';
import { LockOutlined, MailOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sendCode } from '../../../api/auth';
import { requestEmailChange, confirmEmailChange, changePassword, deleteAccount } from '../../../api/user';
import { clearAuth } from '../../../utils/auth';
import VerificationCodeInput from '../../../components/VerificationCodeInput';
import SubTabSlider from '../../../components/SubTabSlider';
import './SectionAccount.css';

const { Text, Title, Paragraph } = Typography;

const ACCOUNT_TABS = [
  { key: 'password', label: '修改密码', icon: <LockOutlined /> },
  { key: 'email', label: '修改邮箱', icon: <MailOutlined /> },
  { key: 'delete', label: '账号注销', icon: <ExclamationCircleOutlined /> },
];

export default function SectionAccount({ userInfo, setUserInfo }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('password');
  const [emailForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  // 邮箱修改状态
  const [emailCodeLoading, setEmailCodeLoading] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailCode, setEmailCode] = useState('');

  // 密码修改状态
  const [pwdCodeLoading, setPwdCodeLoading] = useState(false);
  const [pwdChanging, setPwdChanging] = useState(false);
  const [pwdCode, setPwdCode] = useState('');

  // 账号注销状态
  const [deleteCodeLoading, setDeleteCodeLoading] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleting, setDeleting] = useState(false);

  // 注销确认弹窗倒计时
  useEffect(() => {
    let timer;
    if (deleteModalVisible && deleteCountdown > 0) {
      timer = setTimeout(() => setDeleteCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [deleteModalVisible, deleteCountdown]);

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    try {
      const { newEmail } = emailForm.getFieldsValue();
      if (!newEmail) {
        message.warning('请先输入新邮箱');
        return;
      }
      setEmailCodeLoading(true);
      const res = await sendCode({ email: newEmail });
      if (res?.code !== 200) throw new Error(res?.message || '发送验证码失败');
      await requestEmailChange({ newEmail });
      message.success('验证码已发送');
    } catch (error) {
      message.error(error?.message || '发送验证码失败');
    } finally {
      setEmailCodeLoading(false);
    }
  };

  // 发送密码修改验证码
  const handleSendPwdCode = async () => {
    try {
      if (!userInfo.email) {
        message.error('请先绑定邮箱');
        return;
      }
      setPwdCodeLoading(true);
      const res = await sendCode({ email: userInfo.email });
      if (res?.code !== 200) throw new Error(res?.message || '发送验证码失败');
      message.success('验证码已发送');
    } catch (error) {
      message.error(error?.message || '发送验证码失败');
    } finally {
      setPwdCodeLoading(false);
    }
  };

  // 发送注销验证码
  const handleSendDeleteCode = async () => {
    try {
      if (!userInfo.email) {
        message.error('请先绑定邮箱');
        return;
      }
      setDeleteCodeLoading(true);
      const res = await sendCode({ email: userInfo.email });
      if (res?.code !== 200) throw new Error(res?.message || '发送验证码失败');
      message.success('验证码已发送');
    } catch (error) {
      message.error(error?.message || '发送验证码失败');
    } finally {
      setDeleteCodeLoading(false);
    }
  };

  // 确认修改邮箱
  const handleEmailChange = async () => {
    try {
      const { newEmail } = await emailForm.validateFields(['newEmail']);
      if (!emailCode || emailCode.length !== 6) {
        message.warning('请输入完整的6位验证码');
        return;
      }
      setEmailChanging(true);
      const resp = await confirmEmailChange({ newEmail, verificationCode: emailCode });
      if (resp?.success === false) throw new Error(resp?.message || '修改邮箱失败');
      const nextEmail = newEmail || resp?.user?.email;
      setUserInfo({ ...userInfo, email: nextEmail });
      message.success('邮箱修改成功');
      emailForm.resetFields();
      setEmailCode('');
    } catch (error) {
      message.error(error?.message || '修改邮箱失败');
    } finally {
      setEmailChanging(false);
    }
  };

  // 确认修改密码
  const handlePasswordChange = async () => {
    try {
      const { currentPassword, newPassword, confirmPassword } = await pwdForm.validateFields();
      if (newPassword !== confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      if (!pwdCode || pwdCode.length !== 6) {
        message.warning('请输入完整的6位验证码');
        return;
      }
      setPwdChanging(true);
      const resp = await changePassword({ currentPassword, newPassword, verificationCode: pwdCode });
      if (resp?.success === false) throw new Error(resp?.message || '修改密码失败');
      message.success('密码修改成功');
      pwdForm.resetFields();
      setPwdCode('');
    } catch (error) {
      message.error(error?.message || '修改密码失败');
    } finally {
      setPwdChanging(false);
    }
  };

  // 打开注销确认弹窗
  const handleOpenDeleteModal = useCallback(() => {
    if (!deleteCode || deleteCode.length !== 6) {
      message.warning('请先输入完整的6位验证码');
      return;
    }
    setDeleteCountdown(5);
    setDeleteModalVisible(true);
  }, [deleteCode]);

  // 确认注销账号
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteAccount({ verificationCode: deleteCode });
      message.success('账号已注销');
      clearAuth();
      setDeleteModalVisible(false);
      navigate('/login');
    } catch (error) {
      message.error(error?.message || '注销失败');
    } finally {
      setDeleting(false);
    }
  };

  // 渲染修改密码面板
  const renderPasswordPanel = () => (
    <div className="account-panel">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text type="secondary">需验证邮箱：{userInfo.email || '未绑定邮箱'}</Text>
        <Form form={pwdForm} layout="vertical">
          <Form.Item 
            name="currentPassword" 
            label="当前密码" 
            rules={[{ required: true, message: '请输入当前密码' }]} 
            style={{ marginBottom: 16 }}
          >
            <Input.Password placeholder="请输入当前密码" size="middle" />
          </Form.Item>
          <Form.Item 
            name="newPassword" 
            label="新密码" 
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6位' }]} 
            style={{ marginBottom: 16 }}
          >
            <Input.Password placeholder="请输入新密码" size="middle" />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            label="确认新密码" 
            dependencies={["newPassword"]} 
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({ 
                validator(_, value) { 
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve(); 
                  return Promise.reject(new Error('两次输入不一致')); 
                } 
              })
            ]} 
            style={{ marginBottom: 16 }}
          >
            <Input.Password placeholder="请再次输入新密码" size="middle" />
          </Form.Item>
          <Form.Item label="验证码" style={{ marginBottom: 16 }}>
            <div className="verification-code-row">
              <VerificationCodeInput value={pwdCode} onChange={setPwdCode} />
              <Button className="send-code-btn" onClick={handleSendPwdCode} loading={pwdCodeLoading}>
                发送验证码
              </Button>
            </div>
          </Form.Item>
          <Button type="primary" onClick={handlePasswordChange} loading={pwdChanging} block>
            确认修改密码
          </Button>
        </Form>
      </Space>
    </div>
  );

  // 渲染修改邮箱面板
  const renderEmailPanel = () => (
    <div className="account-panel">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text>当前邮箱：{userInfo.email || '未绑定邮箱'}</Text>
        <Form form={emailForm} layout="vertical" initialValues={{ newEmail: '' }}>
          <Form.Item 
            name="newEmail" 
            label="新邮箱" 
            rules={[{ required: true, message: '请输入新邮箱' }, { type: 'email', message: '邮箱格式不正确' }]} 
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="请输入新邮箱" allowClear size="middle" />
          </Form.Item>
          <Form.Item label="验证码" style={{ marginBottom: 16 }}>
            <div className="verification-code-row">
              <VerificationCodeInput value={emailCode} onChange={setEmailCode} />
              <Button className="send-code-btn" onClick={handleSendEmailCode} loading={emailCodeLoading}>
                发送验证码
              </Button>
            </div>
          </Form.Item>
          <Button type="primary" onClick={handleEmailChange} loading={emailChanging} block>
            确认修改邮箱
          </Button>
        </Form>
      </Space>
    </div>
  );

  // 渲染账号注销面板
  const renderDeletePanel = () => (
    <div className="account-panel delete-panel">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          message="注销账号前请仔细阅读以下内容"
          description={
            <div className="delete-warning-content">
              <Paragraph><WarningOutlined className="warning-icon" /> 账号注销后，以下数据将被永久删除且无法恢复：</Paragraph>
              <ul>
                <li>您的所有账号信息（用户名、邮箱、个人资料等）</li>
                <li>您发布的所有商品及相关信息</li>
                <li>您的收藏列表和关注列表</li>
                <li>未完成的订单将被取消并删除</li>
              </ul>
              <Paragraph type="secondary">注：已完成的订单记录将会保留，以便交易对方查询。</Paragraph>
            </div>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
        
        <div className="delete-verification">
          <Text strong>验证身份</Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            需验证邮箱：{userInfo.email || '未绑定邮箱'}
          </Text>
          <div className="verification-code-row">
            <VerificationCodeInput value={deleteCode} onChange={setDeleteCode} />
            <Button className="send-code-btn" onClick={handleSendDeleteCode} loading={deleteCodeLoading}>
              发送验证码
            </Button>
          </div>
        </div>

        <Button danger type="primary" onClick={handleOpenDeleteModal} block className="delete-account-btn">
          确认注销账号
        </Button>
      </Space>
    </div>
  );

  return (
    <Card className="section-card section-account-card">
      <div className="account-tab-header">
        <SubTabSlider
          tabs={ACCOUNT_TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>
      
      <div className="account-content">
        {activeTab === 'password' && renderPasswordPanel()}
        {activeTab === 'email' && renderEmailPanel()}
        {activeTab === 'delete' && renderDeletePanel()}
      </div>

      {/* 注销确认弹窗 */}
      <Modal
        title={
          <span className="delete-modal-title">
            <ExclamationCircleOutlined className="delete-modal-icon" />
            确认注销账号
          </span>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            danger
            type="primary"
            disabled={deleteCountdown > 0}
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            {deleteCountdown > 0 ? `确认注销 (${deleteCountdown}s)` : '确认注销'}
          </Button>
        ]}
        className="delete-confirm-modal"
        centered
      >
        <div className="delete-modal-content">
          <Title level={5} type="danger">此操作不可撤销！</Title>
          <Paragraph>
            您即将永久注销您的账号，所有数据将被删除且无法恢复。
          </Paragraph>
          <Paragraph type="secondary">
            如果您确定要继续，请点击下方的"确认注销"按钮。
          </Paragraph>
        </div>
      </Modal>
    </Card>
  );
}
