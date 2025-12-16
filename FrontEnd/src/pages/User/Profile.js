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
    TeamOutlined,
  } from '@ant-design/icons';
import './Profile.css';
import { PROFILE_BANNER_OPTIONS, DEFAULT_PROFILE_BANNER_KEY } from '../../config/profile';
import { getCurrentUser, updateCurrentUser, uploadAvatar, getMyPublished, getMyPurchases, getFollows, unfollowUser } from '../../api/user';
import { getFavorites, removeFromFavorites } from '../../api/favorites';
import SectionBasic from './Profile/SectionBasic';
import SectionProducts from './Profile/SectionProducts';
import SectionFavorites from './Profile/SectionFavorites';
import SectionAccount from './Profile/SectionAccount';
import SectionOrders from './Profile/SectionOrders';
import SectionFollows from './Profile/SectionFollows';

const { Sider, Content } = Layout;




const UserProfile = () => {
  const [bannerKey, setBannerKey] = useState(DEFAULT_PROFILE_BANNER_KEY);
  const bannerPath = useMemo(() => PROFILE_BANNER_OPTIONS.find(opt => opt.key === bannerKey)?.path ?? null, [bannerKey]);
  const bannerBgUrl = useMemo(() => bannerPath ? new URL(bannerPath, window.location.origin).toString() : null, [bannerPath]);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
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

  // 关注列表
  const [follows, setFollows] = useState([]);


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
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'products', 'orders', 'favorites', 'follows'].includes(tab)) {
      setSelectedKey(tab);
    }

    (async () => {
      setLoading(true);
      try {
        const [info, published, purchases, favs, followList] = await Promise.all([
          getCurrentUser(),
          getMyPublished(),
          getMyPurchases(),
          getFavorites(),
          getFollows()
        ]);
        // 统一字段：id, username, nickname, email, avatar, phone, address, bio, joinDate, gender, lastLoginAt
        // 后端未返回的字段显示为空
        const allowedFields = ['id', 'username', 'nickname', 'email', 'avatar', 'phone', 'address', 'bio', 'joinDate', 'gender', 'lastLoginAt', 'token', 'profileBanner'];
        const normalized = {};
        allowedFields.forEach(key => {
          normalized[key] = info?.[key] ?? '';
        });
        setUserInfo(normalized);
        setMyProducts(Array.isArray(published) ? published : []);
        setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
        setFavorites(Array.isArray(favs) ? favs : []);
        setFollows(Array.isArray(followList) ? followList : []);
      } catch (err) {
        message.error(err?.message || '获取个人中心数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  // 保存基本信息
  const handleBasicSave = async () => {
    const values = basicForm.getFieldsValue();
    const payload = { ...values };
    // 删除不可编辑的字段
    ['id', 'username', 'email', 'token', 'createdAt', 'lastLoginAt', 'joinDate'].forEach(k => { 
      if (k in payload) delete payload[k]; 
    });

    // 验证手机号格式（如果填写了）
    if (payload.phone && !/^1\d{10}$/.test(payload.phone)) {
      message.error('手机号格式不正确，请输入11位手机号');
      return;
    }

    // 验证并转换生日格式
    if (payload.birthday) {
      // 支持多种格式：YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD
      const birthdayStr = String(payload.birthday).replace(/[\/\-]/g, '');
      if (!/^\d{8}$/.test(birthdayStr)) {
        message.error('生日格式不正确，请使用 YYYY-MM-DD 或 YYYYMMDD 格式');
        return;
      }
      // 转换为 YYYY-MM-DD 格式
      payload.birthday = `${birthdayStr.slice(0, 4)}-${birthdayStr.slice(4, 6)}-${birthdayStr.slice(6, 8)}`;
    }

    // 转换性别为数字
    if (payload.gender !== undefined && payload.gender !== null) {
      const genderMap = { '男': 1, '女': 2, '保密': 0 };
      if (typeof payload.gender === 'string') {
        payload.gender = genderMap[payload.gender] ?? 0;
      }
    }

    setLoading(true);
    try {
      const updated = await updateCurrentUser(payload);
      const nextUser = { ...userInfo, ...updated };
      setUserInfo(nextUser);
      setIsBasicDirty(false);
      message.success('基本信息已保存');
    } catch (error) {
      message.error(error.message || '保存失败，请重试');
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
    return false;
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

  // 取消关注
  const handleUnfollow = async (sellerId) => {
    try {
      await unfollowUser(sellerId);
      setFollows(follows.filter(item => item.id !== sellerId));
      message.success('已取消关注');
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
    { key: 'follows', icon: <TeamOutlined />, label: '我 的 关 注' },
  ];

  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0) {
      try {
        basicForm.setFieldsValue(userInfo);
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

          {selectedKey === 'follows' && (
            <SectionFollows follows={follows} onUnfollow={handleUnfollow} />
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
