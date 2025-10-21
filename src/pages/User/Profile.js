import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Tabs,
  List,
  Tag,
  Rate,
  Statistic,
  Progress,
  Badge,
  Empty,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Divider,
  Space,
  Typography,
  Tooltip,
  Popconfirm,
  Image
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  ShoppingOutlined,
  HeartOutlined,
  MessageOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TrophyOutlined,
  GiftOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import './Profile.css';
import { getCurrentUser, updateCurrentUser, getUserCollections, uploadAvatar } from '../../api/user';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // 用户信息
  const [userInfo, setUserInfo] = useState({});

  // 统计数据
  const [stats, setStats] = useState({});

  // 我的商品
  const [myProducts, setMyProducts] = useState([]);

  // 购买记录
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  // 收藏列表
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [info, collections] = await Promise.all([
          getCurrentUser(),
          getUserCollections(),
        ]);
        setUserInfo(info || {});
        setStats(info?.stats || {});
        setMyProducts(collections?.published || []);
        setPurchaseHistory(collections?.purchases || []);
        setFavorites(collections?.favorites || []);
      } catch (err) {
        message.error(err?.message || '获取个人中心数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 编辑个人信息
  const handleEditProfile = () => {
    form.setFieldsValue(userInfo);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async (values) => {
    setLoading(true);
    try {
      const updated = await updateCurrentUser(values);
      setUserInfo(updated || { ...userInfo, ...values });
      setEditModalVisible(false);
      message.success('个人信息更新成功！');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传
  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
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
  const handleRemoveFavorite = async (productId) => {
    try {
      setFavorites(favorites.filter(item => item.id !== productId));
      message.success('已取消收藏');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      selling: { color: 'green', text: '在售' },
      sold: { color: 'blue', text: '已售' },
      offline: { color: 'gray', text: '下架' },
      completed: { color: 'green', text: '已完成' },
      pending: { color: 'orange', text: '进行中' }
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="page-container profile-container">
      {/* 用户信息卡片 */}
      <Card className="profile-header" loading={loading}>
        <Row gutter={24} align="middle">
          <Col xs={24} sm={6} md={4}>
            <div className="avatar-section">
              <Badge
                count={userInfo.verified ? <SafetyOutlined style={{ color: '#52c41a' }} /> : 0}
                offset={[-10, 10]}
              >
                <Avatar
                  size={120}
                  src={userInfo.avatar}
                  icon={<UserOutlined />}
                  className="user-avatar"
                />
              </Badge>
              <Button
                type="text"
                icon={<CameraOutlined />}
                onClick={() => setAvatarModalVisible(true)}
                className="avatar-edit-btn"
              >
                更换头像
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={18} md={14}>
            <div className="user-info">
              <Space align="center" className="user-title">
                <Title level={3} style={{ margin: 0 }}>
                  {userInfo.nickname}
                </Title>
                <Tag color="gold">{userInfo.level}</Tag>
                {userInfo.verified && (
                  <Tooltip title="已认证用户">
                    <SafetyOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  </Tooltip>
                )}
              </Space>
              <Text type="secondary">@{userInfo.username}</Text>
              <Paragraph className="user-bio">
                {userInfo.bio}
              </Paragraph>
              <Space wrap>
                <Space>
                  <EnvironmentOutlined />
                  <Text>{userInfo.location}</Text>
                </Space>
                <Space>
                  <CalendarOutlined />
                  <Text>加入于 {userInfo.joinDate}</Text>
                </Space>
                <Space>
                  <TrophyOutlined />
                  <Text>信用分: {userInfo.creditScore}</Text>
                </Space>
                <Space>
                  <GiftOutlined />
                  <Text>积分: {userInfo.points}</Text>
                </Space>
              </Space>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div className="user-actions">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEditProfile}
                block
              >
                编辑资料
              </Button>
              <Button
                icon={<MessageOutlined />}
                onClick={() => navigate('/chat')}
                block
                style={{ marginTop: 8 }}
              >
                发送消息
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计数据 */}
      <Card className="stats-card">
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="发布商品"
              value={stats.publishedCount}
              prefix={<ShoppingOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="成功售出"
              value={stats.soldCount}
              prefix={<TrophyOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="购买商品"
              value={stats.boughtCount}
              prefix={<GiftOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="获得收藏"
              value={stats.favoriteCount}
              prefix={<HeartOutlined />}
            />
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col xs={8}>
            <div className="rating-section">
              <Text strong>用户评价</Text>
              <div>
                <Rate disabled defaultValue={stats.avgRating} allowHalf />
                <Text style={{ marginLeft: 8 }}>
                  {stats.avgRating} ({stats.reviewCount}条评价)
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={8}>
            <div className="credit-section">
              <Text strong>信用等级</Text>
              <div>
                <Progress
                  percent={userInfo.creditScore}
                  size="small"
                  status={userInfo.creditScore >= 90 ? 'success' : 'normal'}
                />
              </div>
            </div>
          </Col>
          <Col xs={8}>
            <div className="follow-section">
              <Space>
                <Text>
                  <Text strong>{stats.followersCount}</Text> 粉丝
                </Text>
                <Text>
                  <Text strong>{stats.followingCount}</Text> 关注
                </Text>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs defaultActiveKey="products" className="profile-tabs">
          <TabPane tab="我的商品" key="products">
            <div className="tab-header">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/publish')}
              >
                发布新商品
              </Button>
            </div>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={myProducts}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    className="product-card"
                    cover={
                      <Image
                        alt={item.title}
                        src={item.images[0]}
                        height={200}
                        style={{ objectFit: 'cover' }}
                      />
                    }
                    actions={[
                      <Tooltip title="查看详情">
                        <EyeOutlined onClick={() => navigate(`/products/${item.id}`)} />
                      </Tooltip>,
                      <Tooltip title="编辑">
                        <EditOutlined />
                      </Tooltip>,
                      <Popconfirm
                        title="确定要删除这个商品吗？"
                        onConfirm={() => handleDeleteProduct(item.id)}
                      >
                        <Tooltip title="删除">
                          <DeleteOutlined />
                        </Tooltip>
                      </Popconfirm>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div className="product-title">
                          <Text ellipsis={{ tooltip: item.title }}>
                            {item.title}
                          </Text>
                          {getStatusTag(item.status)}
                        </div>
                      }
                      description={
                        <div>
                          <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                            ¥{item.price}
                          </Text>
                          <div className="product-stats">
                            <Space>
                              <Text type="secondary">
                                <EyeOutlined /> {item.views}
                              </Text>
                              <Text type="secondary">
                                <HeartOutlined /> {item.favorites}
                              </Text>
                            </Space>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty
                    description="还没有发布任何商品"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={() => navigate('/publish')}>
                      发布第一个商品
                    </Button>
                  </Empty>
                )
              }}
            />
          </TabPane>

          <TabPane tab="购买记录" key="purchases">
            <List
              dataSource={purchaseHistory}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button type="link">查看详情</Button>,
                    item.status === 'completed' && !item.rating && (
                      <Button type="link">评价</Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text>{item.title}</Text>
                        {getStatusTag(item.status)}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>卖家: {item.seller}</Text>
                        <br />
                        <Text>购买时间: {item.buyDate}</Text>
                        <br />
                        <Text strong style={{ color: '#ff4d4f' }}>
                          ¥{item.price}
                        </Text>
                        {item.rating && (
                          <div style={{ marginTop: 8 }}>
                            <Rate disabled defaultValue={item.rating} size="small" />
                            <Text style={{ marginLeft: 8 }}>{item.review}</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty
                    description="还没有购买记录"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />
          </TabPane>

          <TabPane tab="我的收藏" key="favorites">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={favorites}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    className="product-card"
                    cover={
                      <Image
                        alt={item.title}
                        src={item.images[0]}
                        height={200}
                        style={{ objectFit: 'cover' }}
                      />
                    }
                    actions={[
                      <Tooltip title="查看详情">
                        <EyeOutlined onClick={() => navigate(`/products/${item.id}`)} />
                      </Tooltip>,
                      <Popconfirm
                        title="确定要取消收藏吗？"
                        onConfirm={() => handleRemoveFavorite(item.id)}
                      >
                        <Tooltip title="取消收藏">
                          <HeartOutlined style={{ color: '#ff4d4f' }} />
                        </Tooltip>
                      </Popconfirm>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Text ellipsis={{ tooltip: item.title }}>
                          {item.title}
                        </Text>
                      }
                      description={
                        <div>
                          <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                            ¥{item.price}
                          </Text>
                          <br />
                          <Text type="secondary">卖家: {item.seller}</Text>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty
                    description="还没有收藏任何商品"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 编辑个人信息模态框 */}
      <Modal
        title="编辑个人信息"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nickname"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: '请输入手机号' }]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="bio"
                label="个人简介"
              >
                <TextArea
                  rows={4}
                  placeholder="介绍一下自己吧"
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="school"
                label="学校"
              >
                <Input placeholder="请输入学校名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="major"
                label="专业"
              >
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="location"
                label="所在地区"
              >
                <Input placeholder="请输入所在地区" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setEditModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 头像上传模态框 */}
      <Modal
        title="更换头像"
        visible={avatarModalVisible}
        onCancel={() => setAvatarModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <Avatar
            size={120}
            src={userInfo.avatar}
            icon={<UserOutlined />}
            style={{ marginBottom: 16 }}
          />
          <br />
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleAvatarUpload}
          >
            <Button icon={<CameraOutlined />}>选择图片</Button>
          </Upload>
          <div style={{ marginTop: 16, color: '#666' }}>
            <Text type="secondary">支持 JPG、PNG 格式，文件大小不超过 2MB</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfile;