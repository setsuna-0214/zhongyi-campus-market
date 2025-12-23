import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Menu, message, Form, Button } from 'antd';
import { UserOutlined, ShoppingOutlined } from '@ant-design/icons';
import { getUser, getUserPublished, checkIsFollowing, followUser, unfollowUser } from '../../api/user';
import { toGenderLabel } from '../../utils/labels';
import SectionBasic from './Profile/SectionBasic';
import SectionProducts from './Profile/SectionProducts';
import './Profile.css';
import { DEFAULT_PROFILE_BANNER_KEY, PROFILE_BANNER_OPTIONS } from '../../config/profile';

const { Sider, Content } = Layout;

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [myProducts, setMyProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Banner related
  const [bannerKey, setBannerKey] = useState(DEFAULT_PROFILE_BANNER_KEY);
  const bannerPath = useMemo(() => PROFILE_BANNER_OPTIONS.find(opt => opt.key === bannerKey)?.path ?? null, [bannerKey]);
  const bannerBgUrl = useMemo(() => bannerPath ? new URL(bannerPath, window.location.origin).toString() : null, [bannerPath]);

  // Form for SectionBasic (read-only for seller profile but required by component)
  const [basicForm] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userData, userProducts, following] = await Promise.all([
          getUser(id),
          getUserPublished(id),
          checkIsFollowing(id)
        ]);
        
        // 规范化用户信息
        const normalizedUser = userData || {};
        // 将后端返回的数字性别转换为字符串
        normalizedUser.gender = toGenderLabel(normalizedUser.gender);
        setUserInfo(normalizedUser);
        setMyProducts(Array.isArray(userProducts) ? userProducts : []);
        setIsFollowing(following);
        
        // Set banner if user has one
        if (userData?.profileBanner && PROFILE_BANNER_OPTIONS.some(o => o.key === userData.profileBanner)) {
          setBannerKey(userData.profileBanner);
        }
      } catch (error) {
        message.error('获取卖家信息失败');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0) {
      try {
        const merged = { ...userInfo };
        merged.address = userInfo.address || merged.address || '';
        delete merged.adress;
        delete merged.location;
        basicForm.setFieldsValue(merged);
      } catch {}
    }
  }, [userInfo, basicForm]);

  const menuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '基 本 信 息' },
    { key: 'products', icon: <ShoppingOutlined />, label: '商 品 管 理' },
  ];

  const noOp = () => {};

  // 获取当前登录用户ID
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.id;
      }
    } catch {}
    return null;
  };

  const handleFollow = async () => {
    // 检查是否已登录
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      message.warning('请先登录后再关注');
      navigate('/login');
      return;
    }
    // 检查是否关注自己
    if (String(currentUserId) === String(id)) {
      message.warning('不能关注自己');
      return;
    }
    try {
      if (isFollowing) {
        await unfollowUser(id);
        message.success('已取消关注');
        setIsFollowing(false);
      } else {
        await followUser(id);
        message.success('关注成功');
        setIsFollowing(true);
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

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
            <div className="read-only-profile">
              <SectionBasic
                userInfo={userInfo}
                bannerKey={bannerKey}
                bannerBgUrl={bannerBgUrl}
                basicForm={basicForm}
                isBasicDirty={false}
                onBasicDirtyChange={noOp}
                onSaveBasic={noOp}
                onChangeBannerKey={noOp}
                onOpenAvatarModal={noOp}
                loading={loading}
                isReadOnly={true}
              />

              <div className="read-only-overlay" />
              
              <div style={{ marginTop: 16, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button 
                  type={isFollowing ? 'default' : 'primary'} 
                  size="large" 
                  onClick={handleFollow}
                >
                  {isFollowing ? '已关注' : '关注'}
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={() => {
                    const currentUserId = getCurrentUserId();
                    if (!currentUserId) {
                      message.warning('请先登录后再联系卖家');
                      navigate('/login');
                      return;
                    }
                    const params = new URLSearchParams({
                      sellerId: id,
                      partnerName: userInfo.nickname || userInfo.username || '未知用户',
                      partnerAvatar: userInfo.avatar || ''
                    });
                    navigate(`/chat?${params.toString()}`);
                  }}
                  ghost
                >
                  联系TA
                </Button>
              </div>
            </div>
          )}

          {selectedKey === 'products' && (
            <SectionProducts 
              myProducts={myProducts} 
              purchaseHistory={[]}
              onDeleteProduct={noOp}
              onNavigate={navigate}
              isReadOnly={true}
            />
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default SellerProfile;
