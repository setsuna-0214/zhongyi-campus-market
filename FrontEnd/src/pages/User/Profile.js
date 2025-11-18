import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
  import {
    Layout,
    Menu,
    Button,
    Modal,
    Form,
    Upload,
    message,
  } from 'antd';
  import {
    UserOutlined,
    ShoppingOutlined,
    HeartOutlined,
    CameraOutlined,
    LockOutlined,
    OrderedListOutlined,
  } from '@ant-design/icons';
import './Profile.css';
import { PROFILE_BANNER_OPTIONS, DEFAULT_PROFILE_BANNER_KEY } from '../../config/profile';
import { getCurrentUser, updateCurrentUser, uploadAvatar, getMyPublished, getMyPurchases } from '../../api/user';
import { getFavorites, removeFromFavorites } from '../../api/favorites';
import SectionBasic from './Profile/SectionBasic';
import SectionProducts from './Profile/SectionProducts';
import SectionFavorites from './Profile/SectionFavorites';
import SectionAccount from './Profile/SectionAccount';
import SectionOrders from './Profile/SectionOrders';

const { Sider, Content } = Layout;

const nonEditableKeys = ['id','username','token','createdAt','lastLoginAt','joinDate'];

const UserProfile = () => {
  const [bannerKey, setBannerKey] = useState(DEFAULT_PROFILE_BANNER_KEY);
  const bannerPath = useMemo(() => PROFILE_BANNER_OPTIONS.find(opt => opt.key === bannerKey)?.path ?? null, [bannerKey]);
  const bannerBgUrl = useMemo(() => bannerPath ? new URL(bannerPath, window.location.origin).toString() : null, [bannerPath]);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  // 旧编辑资料模态已移除
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  // 新的基本信息编辑表单
  const [basicForm] = Form.useForm();
  const [isBasicDirty, setIsBasicDirty] = useState(false);
  const [selectedKey, setSelectedKey] = useState('profile');

  // 用户信息
  const [userInfo, setUserInfo] = useState({});

  // 我的商品
  const [myProducts, setMyProducts] = useState([]);

  // 购买记录
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  // 收藏列表
  const [favorites, setFavorites] = useState([]);


  // 初始化横幅背景图：优先用户信息，其次本地存储，最后默认
  useEffect(() => {
    const storedKey = localStorage.getItem('profileBannerKey');
    const preferred = userInfo?.profileBanner || storedKey || DEFAULT_PROFILE_BANNER_KEY;
    if (PROFILE_BANNER_OPTIONS.some(o => o.key === preferred)) {
      setBannerKey(preferred);
    } else {
      setBannerKey(DEFAULT_PROFILE_BANNER_KEY);
    }
  }, [userInfo]);

  useEffect(() => {
    // 根据 URL 查询参数设置初始 tab
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'products', 'orders', 'favorites'].includes(tab)) {
      setSelectedKey(tab);
    }

    (async () => {
      setLoading(true);
      try {
        const [info, published, purchases, favs] = await Promise.all([
          getCurrentUser(),
          getMyPublished(),
          getMyPurchases(),
          getFavorites()
        ]);
        // 归一化：仅保留 address，清理历史拼写与冗余字段
        const normalized = { ...(info || {}) };
        if (normalized.adress && !normalized.address) {
          normalized.address = normalized.adress;
        }
        if (!normalized.address && normalized.location) {
          normalized.address = normalized.location;
        }
        delete normalized.adress;
        delete normalized.location;
        setUserInfo(normalized);
        setMyProducts(Array.isArray(published) ? published : []);
        setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
        setFavorites(Array.isArray(favs) ? favs : []);
      } catch (err) {
        message.error(err?.message || '获取个人中心数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  // 保存基本信息（下方可编辑区域）
  const handleBasicSave = async () => {
    const values = basicForm.getFieldsValue();
    // 地址合并：仅使用 address，移除不应更新的字段
    const payload = { ...values };
    payload.address = payload.address || userInfo.address || '';
    // 清理：移除 location 与非可编辑字段，避免被更新
    delete payload.location;
    nonEditableKeys.forEach(k => { if (k in payload) delete payload[k]; });
    setLoading(true);
    try {
      const updated = await updateCurrentUser(payload);
      // 更新本地状态，确保 location 不再使用，仅保留 address
      const nextUser = { ...userInfo, ...updated };
      delete nextUser.location;
      setUserInfo(nextUser);
      setIsBasicDirty(false);
      message.success('基本信息已保存');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传
  const handleAvatarUpload = async (file) => {
    try {
      const resp = await uploadAvatar(file);
      const newAvatar = resp?.avatarUrl;
      if (newAvatar) {
        setUserInfo({ ...userInfo, avatar: newAvatar });
      }
      message.success('头像更新成功！');
    } catch (error) {
      message.error('头像上传失败');
    }
    return false; // 阻止默认上传行为
  };

  // 删除商品
  const handleDeleteProduct = async (productId) => {
    try {
      setMyProducts(myProducts.filter(item => item.id !== productId));
      message.success('商品删除成功！');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 取消收藏
  const handleRemoveFavorite = async (favoriteItemId) => {
    try {
      await removeFromFavorites(favoriteItemId);
      setFavorites(favorites.filter(item => item.id !== favoriteItemId));
      message.success('已取消收藏');
    } catch (error) {
      message.error('操作失败');
    }
  };


  const menuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '基 本 信 息' },
    { key: 'account', icon: <LockOutlined />, label: '账 户 信 息' },
    { key: 'products', icon: <ShoppingOutlined />, label: '商 品 管 理' },
    { key: 'orders', icon: <OrderedListOutlined />, label: '订 单 处 理' },
    { key: 'favorites', icon: <HeartOutlined />, label: '商 品 收 藏' },
  ];

  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0) {
      try {
        const merged = { ...userInfo };
        merged.address = userInfo.address || merged.address || '';
        delete merged.adress;
        delete merged.location;
        basicForm.setFieldsValue(merged);
      } catch {}
      setIsBasicDirty(false);
    }
  }, [userInfo, basicForm]);

  return (
    <div className="page-container user-page">
      <Layout className="user-layout">
        <Sider className="user-sider" width={220} theme="light">
          <div className="user-sider-header">
            <span className="user-sider-title">个 人 中 心</span>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={(e) => setSelectedKey(e.key)}
            items={menuItems}
          />
        </Sider>
        <Content className="user-content">
          {selectedKey === 'profile' && (
            <SectionBasic
              userInfo={userInfo}
              bannerKey={bannerKey}
              bannerBgUrl={bannerBgUrl}
              basicForm={basicForm}
              isBasicDirty={isBasicDirty}
              onBasicDirtyChange={setIsBasicDirty}
              onSaveBasic={handleBasicSave}
              onChangeBannerKey={async (key) => { try { setBannerKey(key); localStorage.setItem('profileBannerKey', key); await updateCurrentUser({ profileBanner: key }); } catch {} }}
              onOpenAvatarModal={() => setAvatarModalVisible(true)}
              loading={loading}
            />
          )}

          {selectedKey === 'products' && (
            <SectionProducts myProducts={myProducts} purchaseHistory={purchaseHistory} onDeleteProduct={handleDeleteProduct} onNavigate={navigate} />
          )}

          {selectedKey === 'orders' && (
            <SectionOrders userInfo={userInfo} onNavigate={navigate} />
          )}

          {selectedKey === 'favorites' && (
            <SectionFavorites favorites={favorites} onRemoveFavorite={handleRemoveFavorite} onNavigate={navigate} />
          )}

          {selectedKey === 'account' && (
            <SectionAccount userInfo={userInfo} setUserInfo={setUserInfo} />
          )}

          {/* 更换头像 */}
          <Modal
            title="更换头像"
            open={avatarModalVisible}
            onCancel={() => setAvatarModalVisible(false)}
            footer={null}
          >
            <Upload name="avatar" showUploadList={false} beforeUpload={handleAvatarUpload}>
              <Button icon={<CameraOutlined />}>选择图片并上传</Button>
            </Upload>
          </Modal>
        </Content>
      </Layout>
    </div>
  );
};

export default UserProfile;
