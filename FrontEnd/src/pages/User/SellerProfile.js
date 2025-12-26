import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, message, Form, Button, Empty } from 'antd';
import { UserOutlined, ShoppingOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { getUser, getUserPublished, checkIsFollowing, followUser, unfollowUser } from '../../api/user';
import { toGenderLabel } from '../../utils/labels';
import SectionBasic from './Profile/SectionBasic';
import SectionProducts from './Profile/SectionProducts';
import SliderMenu from '../../components/SliderMenu';
import FollowButton from '../../components/FollowButton';
import './Profile.css';
import './SellerProfile.css';
import { DEFAULT_PROFILE_BANNER_KEY, PROFILE_BANNER_OPTIONS } from '../../config/profile';
import { getCurrentUserId, isSelf } from '../../utils/auth';
import { useLoginPrompt } from '../../components/LoginPromptModal';

const { Sider, Content } = Layout;

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoginPrompt } = useLoginPrompt();
  const [selectedKey, setSelectedKey] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [myProducts, setMyProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  
  // Banner related
  const [bannerKey, setBannerKey] = useState(DEFAULT_PROFILE_BANNER_KEY);
  const bannerPath = useMemo(() => PROFILE_BANNER_OPTIONS.find(opt => opt.key === bannerKey)?.path ?? null, [bannerKey]);
  const bannerBgUrl = useMemo(() => bannerPath ? new URL(bannerPath, window.location.origin).toString() : null, [bannerPath]);

  // Form for SectionBasic (read-only for seller profile but required by component)
  const [basicForm] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setUserNotFound(false);
      try {
        const [userData, userProducts, following] = await Promise.all([
          getUser(id),
          getUserPublished(id),
          checkIsFollowing(id)
        ]);
        
        // 检查用户是否存在或已注销
        if (!userData || userData.deleted || userData.status === 'deleted') {
          setUserNotFound(true);
          setUserInfo({});
          setMyProducts([]);
          return;
        }
        
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
        // 404 或用户不存在
        if (error?.response?.status === 404 || error?.message?.includes('不存在')) {
          setUserNotFound(true);
          setUserInfo({});
          setMyProducts([]);
        } else {
          message.error('获取用户信息失败');
        }
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
    { key: 'profile', icon: <UserOutlined />, label: '基本信息' },
    { key: 'products', icon: <ShoppingOutlined />, label: 'TA的商品' },
  ];

  const noOp = () => {};

  // 用户不存在或已注销时的显示
  const renderUserNotFound = () => (
    <div className="user-not-found-container">
      <div 
        className="avatar-banner user-not-found-banner"
        style={{ backgroundImage: `url(${PROFILE_BANNER_OPTIONS[0]?.path || '/images/banners/banner-1.jpg'})` }}
      >
        <div className="avatar-wrapper">
          <div className="avatar-box">
            <div className="user-avatar user-avatar-placeholder">
              <UserDeleteOutlined />
            </div>
          </div>
        </div>
      </div>
      <div className="user-not-found-content">
        <Empty
          image={<UserDeleteOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
          description={
            <div className="user-not-found-text">
              <h3>用户不存在</h3>
              <p>该用户可能已注销账号或从未存在</p>
            </div>
          }
        >
          <Button type="primary" onClick={() => navigate(-1)}>返回上一页</Button>
        </Empty>
      </div>
    </div>
  );

  const handleFollow = async () => {
    // 检查是否已登录
    if (!getCurrentUserId()) {
      showLoginPrompt({ message: '关注用户需要登录后才能进行' });
      return;
    }
    // 检查是否关注自己
    if (isSelf(id)) {
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
    <div className="user-page">
      <Layout className="user-layout">
        <Sider className="user-sider" width={220} theme="light">
          <div className="user-sider-header">
            <span className="user-sider-title">个 人 中 心</span>
          </div>
          <SliderMenu
            items={menuItems}
            selectedKey={selectedKey}
            onSelect={(key) => setSelectedKey(key)}
          />
        </Sider>
        <Content className="user-content">
          {userNotFound ? (
            renderUserNotFound()
          ) : (
            <>
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
                    followersCount={userInfo.followersCount ?? 0}
                    followingCount={userInfo.followingCount ?? 0}
                  />

                  <div className="read-only-overlay" />
                  
                  <div style={{ marginTop: 16, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16 }}>
                    <FollowButton 
                      isFollowing={isFollowing}
                      size="large"
                      onClick={handleFollow}
                    />
                    <Button 
                      type="primary" 
                      size="large" 
                      onClick={() => {
                        if (!getCurrentUserId()) {
                          showLoginPrompt({ message: '联系TA需要登录后才能进行' });
                          return;
                        }
                        const params = new URLSearchParams({
                          sid: id,
                          sname: userInfo.nickname || userInfo.username || '未知用户',
                          savatar: userInfo.avatar || ''
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
                  userInfo={userInfo}
                  showType="published"
                  onSubTabChange={noOp}
                />
              )}
            </>
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default SellerProfile;
