import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Form,
  message,
} from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  HeartOutlined,
  LockOutlined,
  OrderedListOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import SliderMenu from '../../components/SliderMenu';
import AvatarUpload from '../../components/AvatarUpload';
import './Profile.css';
import { PROFILE_BANNER_OPTIONS, DEFAULT_PROFILE_BANNER_KEY } from '../../config/profile';
import { getCurrentUser, updateCurrentUser, getMyPublished, getMyPurchases, getFollows, getFollowers, unfollowUser } from '../../api/user';
import { getFavorites, removeFromFavorites } from '../../api/favorites';
import { toGenderLabel, toGenderNum } from '../../utils/labels';
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

  // 子选项状态（用于商品管理、订单处理和关注的子标签）
  const [productSubTab, setProductSubTab] = useState('published');
  const [orderSubTab, setOrderSubTab] = useState('purchase');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [followSubTab, setFollowSubTab] = useState('following');

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

  // 粉丝列表（用于统计数量）
  const [followers, setFollowers] = useState([]);


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
    // 支持新旧参数名
    const tab = searchParams.get('t') || searchParams.get('tab');
    // 更新为扁平化菜单的有效 tab 值
    const validTabs = ['profile', 'account', 'products', 'orders', 'favorites', 'follows'];
    if (tab && validTabs.includes(tab)) {
      setSelectedKey(tab);
    }

    // 从 URL 恢复子选项状态（使用简短参数名）
    const productSub = searchParams.get('sub');
    const orderSub = searchParams.get('type');
    const orderStat = searchParams.get('status');
    
    // products tab
    if (productSub && ['published', 'purchases'].includes(productSub)) {
      setProductSubTab(productSub);
    }
    // orders tab
    if (orderSub && ['purchase', 'sell'].includes(orderSub)) {
      setOrderSubTab(orderSub);
    }
    if (orderStat && ['pending', 'completed', 'cancelled'].includes(orderStat)) {
      setOrderStatus(orderStat);
    }
    // follows tab
    if (productSub && ['following', 'followers'].includes(productSub)) {
      setFollowSubTab(productSub);
    }

    (async () => {
      setLoading(true);
      try {
        const [info, published, purchases, favs, followList, followerList] = await Promise.all([
          getCurrentUser(),
          getMyPublished(),
          getMyPurchases(),
          getFavorites(),
          getFollows(),
          getFollowers()
        ]);
        // 统一字段：id, username, nickname, email, avatar, phone, address, bio, joinDate, gender, lastLoginAt
        // 后端未返回的字段显示为空
        const allowedFields = ['id', 'username', 'nickname', 'email', 'avatar', 'phone', 'address', 'bio', 'joinDate', 'gender', 'lastLoginAt', 'token', 'profileBanner'];
        const normalized = {};
        allowedFields.forEach(key => {
          normalized[key] = info?.[key] ?? '';
        });
        // 后端返回 user_id，前端统一使用 id
        if (!normalized.id && info?.user_id) {
          normalized.id = info.user_id;
        }
        // 将后端返回的数字性别转换为字符串，以便 Segmented 组件正确高亮
        normalized.gender = toGenderLabel(normalized.gender);
        setUserInfo(normalized);
        setMyProducts(Array.isArray(published) ? published : []);
        setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
        setFavorites(Array.isArray(favs) ? favs : []);
        setFollows(Array.isArray(followList) ? followList : []);
        setFollowers(Array.isArray(followerList) ? followerList : []);
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

    // 转换性别为数字
    if (payload.gender !== undefined && payload.gender !== null) {
      payload.gender = toGenderNum(payload.gender);
    }

    setLoading(true);
    try {
      const updated = await updateCurrentUser(payload);
      // 只保留允许的字段，避免后端返回额外字段导致显示异常
      const allowedFields = ['id', 'username', 'nickname', 'email', 'avatar', 'phone', 'address', 'bio', 'joinDate', 'gender', 'lastLoginAt', 'token', 'profileBanner'];
      const normalized = {};
      allowedFields.forEach(key => {
        // 优先使用更新后的值，否则保留原值
        normalized[key] = updated?.[key] !== undefined ? updated[key] : (userInfo?.[key] ?? '');
      });
      // 后端返回 user_id，前端统一使用 id
      if (!normalized.id && updated?.user_id) {
        normalized.id = updated.user_id;
      }
      // 将后端返回的数字性别转换为字符串
      normalized.gender = toGenderLabel(normalized.gender);
      setUserInfo(normalized);
      setIsBasicDirty(false);
      message.success('基本信息已保存');
    } catch (error) {
      message.error(error.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传成功回调
  const handleAvatarSuccess = (newAvatar) => {
    setUserInfo({ ...userInfo, avatar: newAvatar });
    // 触发全局用户更新事件，通知 Header 等组件更新头像
    window.dispatchEvent(new CustomEvent('userUpdated', { 
      detail: { ...userInfo, avatar: newAvatar } 
    }));
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
      setFavorites(prev => prev.filter(item => item.id !== favoriteItemId));
      message.success('已取消收藏');
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 批量取消收藏
  const handleBatchRemoveFavorites = async (itemIds) => {
    if (!itemIds || itemIds.length === 0) return;
    
    const results = await Promise.allSettled(
      itemIds.map(id => removeFromFavorites(id))
    );
    
    const successIds = [];
    const failedCount = results.filter((r, i) => {
      if (r.status === 'fulfilled') {
        successIds.push(itemIds[i]);
        return false;
      }
      return true;
    }).length;
    
    // 移除成功的项
    if (successIds.length > 0) {
      setFavorites(prev => prev.filter(item => !successIds.includes(item.id)));
    }
    
    if (failedCount === 0) {
      message.success(`已取消 ${successIds.length} 个收藏`);
    } else if (successIds.length > 0) {
      message.warning(`成功取消 ${successIds.length} 个，${failedCount} 个失败`);
    } else {
      message.error('批量取消收藏失败');
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


  // 扁平化菜单项配置（移除子菜单结构）
  const menuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '基本信息' },
    { key: 'account', icon: <LockOutlined />, label: '账户设置' },
    { key: 'products', icon: <ShoppingOutlined />, label: '商品管理' },
    { key: 'orders', icon: <OrderedListOutlined />, label: '订单管理' },
    { key: 'favorites', icon: <HeartOutlined />, label: '我的收藏' },
    { key: 'follows', icon: <TeamOutlined />, label: '我的关注' },
  ];

  // 移除 openKeys 相关逻辑，因为不再有子菜单

  // 更新 URL 参数的辅助函数 - 只保留当前 tab 相关的参数，使用简短参数名
  const updateUrlParams = (updates, currentTab = selectedKey) => {
    const params = new URLSearchParams();
    // profile 是默认值，不需要 t 参数
    if (currentTab !== 'profile') {
      params.set('t', currentTab);
    }
    
    // 根据当前 tab 只添加相关的子参数
    if (currentTab === 'products') {
      const productSub = updates.productSubTab ?? productSubTab;
      if (productSub && productSub !== 'published') {
        params.set('sub', productSub);
      }
    } else if (currentTab === 'orders') {
      const orderSub = updates.orderSubTab ?? orderSubTab;
      const orderStat = updates.orderStatus ?? orderStatus;
      if (orderSub && orderSub !== 'purchase') {
        params.set('type', orderSub);
      }
      if (orderStat && orderStat !== 'pending') {
        params.set('status', orderStat);
      }
    } else if (currentTab === 'follows') {
      const followSub = updates.followSubTab ?? followSubTab;
      if (followSub && followSub !== 'following') {
        params.set('sub', followSub);
      }
    }
    
    const queryString = params.toString();
    navigate(queryString ? `/profile?${queryString}` : '/profile', { replace: true });
  };

  // 处理商品子选项切换
  const handleProductSubTabChange = (subTab) => {
    setProductSubTab(subTab);
    updateUrlParams({ productSubTab: subTab }, 'products');
  };

  // 处理订单子选项切换
  const handleOrderSubTabChange = (subTab) => {
    setOrderSubTab(subTab);
    updateUrlParams({ orderSubTab: subTab }, 'orders');
  };

  // 处理订单状态切换
  const handleOrderStatusChange = (status) => {
    setOrderStatus(status);
    updateUrlParams({ orderStatus: status }, 'orders');
  };

  // 处理关注子选项切换
  const handleFollowSubTabChange = (subTab) => {
    setFollowSubTab(subTab);
    updateUrlParams({ followSubTab: subTab }, 'follows');
  };

  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0) {
      try {
        basicForm.setFieldsValue(userInfo);
      } catch {}
      setIsBasicDirty(false);
    }
  }, [userInfo, basicForm]);

  return (
    <div className="user-page">
      <Layout className="user-layout">
        <Sider className="user-sider" width={220} theme="light">
          <div className="user-sider-header">
            <span className="user-sider-title">个 人 中 心</span>
          </div>
          <SliderMenu
            items={menuItems}
            selectedKey={selectedKey}
            onSelect={(key) => {
              setSelectedKey(key);
              // 切换 tab 时只保留 tab 参数，清除其他子参数
              // profile 是默认值，不需要参数
              navigate(key === 'profile' ? '/profile' : `/profile?t=${key}`, { replace: true });
            }}
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
              followersCount={followers.length}
              followingCount={follows.length}
              onFollowersClick={() => {
                setSelectedKey('follows');
                setFollowSubTab('followers');
                navigate('/profile?t=follows&sub=followers', { replace: true });
              }}
              onFollowingClick={() => {
                setSelectedKey('follows');
                setFollowSubTab('following');
                navigate('/profile?t=follows', { replace: true });
              }}
            />
          )}

          {selectedKey === 'products' && (
            <SectionProducts 
              myProducts={myProducts} 
              purchaseHistory={purchaseHistory} 
              onDeleteProduct={handleDeleteProduct} 
              onNavigate={navigate} 
              userInfo={userInfo}
              showType={productSubTab}
              onSubTabChange={handleProductSubTabChange}
            />
          )}

          {selectedKey === 'orders' && (
            <SectionOrders 
              userInfo={userInfo} 
              onNavigate={navigate} 
              orderType={orderSubTab}
              orderStatus={orderStatus}
              onOrderTypeChange={handleOrderSubTabChange}
              onOrderStatusChange={handleOrderStatusChange}
            />
          )}

          {selectedKey === 'favorites' && (
            <SectionFavorites 
              favorites={favorites} 
              onRemoveFavorite={handleRemoveFavorite} 
              onBatchRemoveFavorites={handleBatchRemoveFavorites}
              onNavigate={navigate} 
            />
          )}

          {selectedKey === 'follows' && (
            <SectionFollows 
              follows={follows} 
              onUnfollow={handleUnfollow}
              followSubTab={followSubTab}
              onSubTabChange={handleFollowSubTabChange}
            />
          )}

          {selectedKey === 'account' && (
            <SectionAccount userInfo={userInfo} setUserInfo={setUserInfo} />
          )}

          {/* 更换头像 */}
          <AvatarUpload
            visible={avatarModalVisible}
            onClose={() => setAvatarModalVisible(false)}
            currentAvatar={userInfo.avatar}
            onSuccess={handleAvatarSuccess}
          />
        </Content>
      </Layout>
    </div>
  );
};

export default UserProfile;
