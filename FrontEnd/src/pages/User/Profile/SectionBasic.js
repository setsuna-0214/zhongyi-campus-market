import React from 'react';
import { Card, Avatar, Button, Form, Input, Select, Checkbox, Row, Col, Space, Typography, Popover, Segmented } from 'antd';
import { UserOutlined, CameraOutlined, SettingOutlined } from '@ant-design/icons';
import { PROFILE_BANNER_OPTIONS } from '../../../config/profile';

const { Text } = Typography;
const { TextArea } = Input;

const userFieldLabels = {
  id: '用户ID',
  username: '用户名',
  nickname: '昵称',
  role: '角色',
  school: '学校',
  phone: '电话',
  email: '邮箱',
  address: '地址',
  joinDate: '加入日期',
  token: 'Token',
  avatar: '头像',
  bio: '个人简介',
  gender: '性别',
  department: '学院/系',
  grade: '年级',
  createdAt: '创建时间',
  lastLoginAt: '最近登录时间'
};

const excludedFields = ['id', 'role', 'school', 'token', 'wechat', 'age', 'studentId', 'location', 'createdAt', 'email'];
const nonEditableKeys = ['id','username','token','createdAt','lastLoginAt','joinDate'];
const preferredOrder = ['username', 'nickname'];

const formatToYMDHMS = (input) => {
  if (!input) return '';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) {
      return String(input);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  } catch (_) {
    return String(input);
  }
};

export default function SectionBasic({ userInfo, bannerKey, bannerBgUrl, basicForm, isBasicDirty, onBasicDirtyChange, onSaveBasic, onChangeBannerKey, onOpenAvatarModal, loading }) {
  return (
    <Card className="section-card" loading={loading}>
      <div className="avatar-banner" style={bannerBgUrl ? { backgroundImage: `url(${bannerBgUrl})` } : { backgroundImage: 'none', backgroundColor: '#fafafa' }}>
        <div className="avatar-wrapper">
          <div className="avatar-box">
            <Avatar size={120} src={userInfo.avatar} icon={<UserOutlined />} className="user-avatar" />
            <Button shape="circle" size="small" type="default" icon={<CameraOutlined />} aria-label="更换头像" onClick={onOpenAvatarModal} className="avatar-edit-icon" />
          </div>
        </div>
        <Popover placement="topRight" trigger="click" content={(
          <Form layout="inline">
            <Form.Item label="头像背景图" style={{ marginBottom: 0 }}>
              <Select size="middle" style={{ minWidth: 180 }} value={bannerKey} onChange={onChangeBannerKey} options={PROFILE_BANNER_OPTIONS.map(opt => ({ label: opt.label, value: opt.key }))} />
            </Form.Item>
          </Form>
        )}>
          <Button shape="circle" size="small" type="default" icon={<SettingOutlined />} aria-label="界面设置" className="banner-settings-icon" />
        </Popover>
      </div>
      <div style={{ marginTop: 12 }}>
        <Form
          form={basicForm}
          layout="inline"
          onValuesChange={(_, values) => {
            try {
              onBasicDirtyChange(JSON.stringify(values) !== JSON.stringify(userInfo));
            } catch {
              onBasicDirtyChange(true);
            }
          }}
        >
          <Row gutter={[12, 12]}>
            {(() => {
              const entries = Object.entries(userInfo || {}).filter(([key]) => key !== 'avatar' && !excludedFields.includes(key));
              const keysOrdered = [
                ...preferredOrder.filter(k => entries.some(([ek]) => ek === k)),
                ...entries.map(([k]) => k).filter(k => !preferredOrder.includes(k))
              ];
              return keysOrdered.map((key) => {
                const value = userInfo ? userInfo[key] : undefined;
                const label = userFieldLabels[key] || key;
                const isNonEditable = nonEditableKeys.includes(key);
                const isBoolean = typeof value === 'boolean';
                const isArray = Array.isArray(value);
                const isObject = typeof value === 'object' && !isArray && value !== null;
                const rawStr = (() => {
                  if (value === null || value === undefined || value === '') return '-';
                  if (key === 'address') {
                    return String(userInfo?.address || value || '-');
                  }
                  if (key === 'lastLoginAt') {
                    return formatToYMDHMS(value);
                  }
                  if (isBoolean) return value ? '是' : '否';
                  if (isArray) return value.join(', ');
                  if (isObject) {
                    try { return JSON.stringify(value); } catch { return String(value); }
                  }
                  return String(value);
                })();
                const len = rawStr.length;
                const colSpan = len <= 10 || isBoolean ? 8 : len <= 20 ? 12 : 24;
                if (key === 'bio') {
                  return (
                    <Col key={key} span={24} xs={24} sm={24} md={24}>
                      <div style={{ width: '100%' }}>
                        <Text strong>{label}</Text>
                        <Form.Item name={key} style={{ marginTop: 8, marginBottom: 8 }}>
                          <TextArea rows={4} />
                        </Form.Item>
                      </div>
                    </Col>
                  );
                }
                return (
                  <Col key={key} span={colSpan} xs={24} sm={colSpan === 24 ? 24 : 12} md={colSpan}>
                    {isNonEditable ? (
                      <div>
                        <Text strong>{label}：</Text>
                        <Text style={{ marginLeft: 8 }}>{rawStr}</Text>
                      </div>
                    ) : (
                      <Form.Item name={key} label={label} style={{ marginBottom: 8 }}>
                        {key === 'gender' ? (
                          <Segmented
                            className="gender-highlight-segmented"
                            size="middle"
                            options={[{ label: '男', value: '男' },{ label: '女', value: '女' },{ label: '保密', value: '保密' }]}
                            value={basicForm.getFieldValue('gender') ?? (value ?? '保密')}
                            onChange={(val) => basicForm.setFieldsValue({ gender: val })}
                          />
                        ) : isBoolean ? (
                          <Checkbox checked={!!basicForm.getFieldValue(key)} onChange={(e) => basicForm.setFieldsValue({ [key]: e.target.checked })}>{rawStr === '-' ? label : ''}</Checkbox>
                        ) : isArray || isObject ? (
                          <TextArea rows={3} />
                        ) : (
                          <Input />
                        )}
                      </Form.Item>
                    )}
                  </Col>
                );
              });
            })()}
            <Col span={24}>
              <Space>
                <Button type={isBasicDirty ? 'primary' : 'default'} disabled={!isBasicDirty} onClick={onSaveBasic}>保存</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>
    </Card>
  );
}

