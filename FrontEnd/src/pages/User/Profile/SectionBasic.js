import { useState, useEffect, useRef } from 'react';
import { Card, Avatar, Button, Form, Input, Checkbox, Row, Col, Space, Typography, Segmented } from 'antd';
import { UserOutlined, CameraOutlined, PictureOutlined } from '@ant-design/icons';
import { PROFILE_BANNER_OPTIONS } from '../../../config/profile';
import { GENDER_OPTIONS } from '../../../utils/labels';

const { Text } = Typography;
const { TextArea } = Input;

// 统一字段：id, username, nickname, email, avatar, phone, address, bio, joinDate, gender, lastLoginAt
const userFieldLabels = {
  id: '用户ID',
  user_id: '用户ID',
  username: '用户名',
  nickname: '昵称',
  email: '邮箱',
  phone: '电话',
  address: '地址',
  bio: '个人简介',
  joinDate: '加入日期',
  gender: '性别',
  lastLoginAt: '最近登录',
  avatar: '头像',
  token: 'Token',
};

// 不显示的字段
const excludedFields = ['id', 'token', 'avatar', 'profileBanner'];
// 不可编辑的字段
const nonEditableKeys = ['id', 'username', 'email', 'token', 'joinDate', 'lastLoginAt'];
// 字段显示顺序
const preferredOrder = ['username', 'nickname', 'phone', 'email', 'address', 'gender', 'bio', 'joinDate', 'lastLoginAt'];

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

export default function SectionBasic({ 
  userInfo, 
  bannerKey, 
  bannerBgUrl, 
  basicForm, 
  isBasicDirty, 
  onBasicDirtyChange, 
  onSaveBasic, 
  onChangeBannerKey, 
  onOpenAvatarModal, 
  loading,
  isReadOnly = false 
}) {
  // 背景图淡入淡出状态
  const [displayedBgUrl, setDisplayedBgUrl] = useState(bannerBgUrl);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  // 当 bannerBgUrl 变化时，触发淡入淡出效果
  useEffect(() => {
    if (bannerBgUrl !== displayedBgUrl) {
      setIsFading(true);
      // 清除之前的定时器
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      // 淡出后切换背景，然后淡入
      fadeTimeoutRef.current = setTimeout(() => {
        setDisplayedBgUrl(bannerBgUrl);
        setIsFading(false);
      }, 200);
    }
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [bannerBgUrl, displayedBgUrl]);

  // 循环切换背景图
  const handleCycleBanner = () => {
    const currentIndex = PROFILE_BANNER_OPTIONS.findIndex(opt => opt.key === bannerKey);
    const nextIndex = (currentIndex + 1) % PROFILE_BANNER_OPTIONS.length;
    onChangeBannerKey(PROFILE_BANNER_OPTIONS[nextIndex].key);
  };

  return (
    <Card className="section-card" loading={loading}>
      <div 
        className={`avatar-banner ${isFading ? 'banner-fading' : ''}`} 
        style={displayedBgUrl ? { backgroundImage: `url(${displayedBgUrl})` } : { backgroundImage: 'none', backgroundColor: '#fafafa' }}
      >
        <div className="avatar-wrapper">
          <div className="avatar-box">
            <Avatar size={120} src={userInfo.avatar} icon={<UserOutlined />} className="user-avatar" />
            {!isReadOnly && (
              <Button shape="circle" size="small" type="default" icon={<CameraOutlined />} aria-label="更换头像" onClick={onOpenAvatarModal} className="avatar-edit-icon" />
            )}
          </div>
        </div>
        {!isReadOnly && (
          <Button shape="circle" size="small" type="default" icon={<PictureOutlined />} aria-label="切换背景图" onClick={handleCycleBanner} className="banner-settings-icon" />
        )}
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
                // 在只读模式下，所有字段都视为不可编辑
                const isNonEditable = isReadOnly || nonEditableKeys.includes(key);
                const isBoolean = typeof value === 'boolean';
                const isArray = Array.isArray(value);
                const isObject = typeof value === 'object' && !isArray && value !== null;
                const rawStr = (() => {
                  if (value === null || value === undefined || value === '') return '-';
                  if (key === 'lastLoginAt' || key === 'joinDate') {
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
                        {isReadOnly ? (
                          <div style={{ marginTop: 8, marginBottom: 8, padding: '4px 11px', backgroundColor: 'rgba(0, 0, 0, 0.02)', border: '1px solid #d9d9d9', borderRadius: '6px', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                            {value || '-'}
                          </div>
                        ) : (
                          <Form.Item name={key} style={{ marginTop: 8, marginBottom: 8 }}>
                            <TextArea rows={4} />
                          </Form.Item>
                        )}
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
                            options={GENDER_OPTIONS}
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
            {!isReadOnly && (
              <Col span={24}>
                <Space>
                  <Button type={isBasicDirty ? 'primary' : 'default'} disabled={!isBasicDirty} onClick={onSaveBasic}>保存</Button>
                </Space>
              </Col>
            )}
          </Row>
        </Form>
      </div>
    </Card>
  );
}

