import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  List,
  Avatar,
  Tabs,
  DatePicker,
  message,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TruckOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  EditOutlined,
  ExportOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import './Dashboard.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// 将静态数据移到组件外部，避免重复渲染
const mockDashboardData = {
  statsData: {
    totalUsers: 1234,
    totalProducts: 567,
    totalOrders: 890,
    totalRevenue: 123456.78,
    userGrowth: 12.5,
    productGrowth: 8.3,
    orderGrowth: 15.2,
    revenueGrowth: 22.1
  },
  recentOrders: [
    {
      id: 'ORD001',
      user: '张三',
      product: 'iPhone 14 Pro',
      amount: 8999,
      status: 'pending',
      createTime: '2024-01-15 10:30:00'
    },
    {
      id: 'ORD002',
      user: '李四',
      product: 'MacBook Pro',
      amount: 15999,
      status: 'shipped',
      createTime: '2024-01-15 09:15:00'
    },
    {
      id: 'ORD003',
      user: '王五',
      product: 'AirPods Pro',
      amount: 1999,
      status: 'completed',
      createTime: '2024-01-15 08:45:00'
    },
    {
      id: 'ORD004',
      user: '赵六',
      product: 'iPad Air',
      amount: 4599,
      status: 'cancelled',
      createTime: '2024-01-15 07:20:00'
    },
    {
      id: 'ORD005',
      user: '钱七',
      product: 'Apple Watch',
      amount: 2999,
      status: 'pending',
      createTime: '2024-01-15 06:10:00'
    }
  ],
  recentUsers: [
    {
      id: 1,
      nickname: '新用户001',
      email: 'user001@example.com',
      avatar: null,
      registerTime: '2024-01-15 11:30:00',
      status: 'active'
    },
    {
      id: 2,
      nickname: '新用户002',
      email: 'user002@example.com',
      avatar: null,
      registerTime: '2024-01-15 10:45:00',
      status: 'active'
    },
    {
      id: 3,
      nickname: '新用户003',
      email: 'user003@example.com',
      avatar: null,
      registerTime: '2024-01-15 09:20:00',
      status: 'pending'
    },
    {
      id: 4,
      nickname: '新用户004',
      email: 'user004@example.com',
      avatar: null,
      registerTime: '2024-01-15 08:15:00',
      status: 'active'
    }
  ],
  systemAlerts: [
    {
      id: 1,
      type: 'warning',
      title: '库存不足警告',
      content: 'iPhone 14 Pro 库存仅剩 5 件',
      time: '2024-01-15 12:00:00'
    },
    {
      id: 2,
      type: 'error',
      title: '支付异常',
      content: '订单 ORD001 支付处理失败',
      time: '2024-01-15 11:45:00'
    },
    {
      id: 3,
      type: 'info',
      title: '系统维护通知',
      content: '系统将于今晚 2:00-4:00 进行维护',
      time: '2024-01-15 11:30:00'
    },
    {
      id: 4,
      type: 'success',
      title: '数据备份完成',
      content: '今日数据备份已成功完成',
      time: '2024-01-15 11:00:00'
    }
  ]
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(null);
  
  // 直接使用静态数据，避免状态更新导致的重新渲染
  const statsData = mockDashboardData.statsData;
  const recentOrders = mockDashboardData.recentOrders;
  const recentUsers = mockDashboardData.recentUsers;
  const systemAlerts = mockDashboardData.systemAlerts;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 这里应该是真实的API调用
      console.log('刷新仪表板数据', { dateRange });
      message.success('数据刷新成功');
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    message.success('数据导出中...');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      shipped: 'blue',
      completed: 'green',
      cancelled: 'red',
      active: 'green',
      inactive: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待处理',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消',
      active: '活跃',
      inactive: '非活跃'
    };
    return texts[status] || status;
  };

  const getAlertIcon = (type) => {
    const icons = {
      warning: <WarningOutlined style={{ color: '#faad14' }} />,
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user'
    },
    {
      title: '商品',
      dataIndex: 'product',
      key: 'product'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>¥{amount.toLocaleString()}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="tag-pill tag-sm tag-bold">
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, _record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container admin-dashboard">
      {/* 页面头部 */}
      <Card className="dashboard-header-card">
        <div className="dashboard-header">
          <div className="header-left">
            <Title level={3}>管理员仪表板</Title>
            <Text type="secondary">欢迎回来，管理员</Text>
          </div>
          <div className="header-actions">
            <Space>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={['开始日期', '结束日期']}
              />
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总用户数"
              value={statsData.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <div className="growth-indicator">
                  {statsData.userGrowth > 0 ? (
                    <span className="growth-positive">
                      <RiseOutlined /> {statsData.userGrowth}%
                    </span>
                  ) : (
                    <span className="growth-negative">
                      <FallOutlined /> {Math.abs(statsData.userGrowth)}%
                    </span>
                  )}
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总商品数"
              value={statsData.totalProducts}
              prefix={<ShoppingOutlined />}
              suffix={
                <div className="growth-indicator">
                  {statsData.productGrowth > 0 ? (
                    <span className="growth-positive">
                      <RiseOutlined /> {statsData.productGrowth}%
                    </span>
                  ) : (
                    <span className="growth-negative">
                      <FallOutlined /> {Math.abs(statsData.productGrowth)}%
                    </span>
                  )}
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总订单数"
              value={statsData.totalOrders}
              prefix={<TruckOutlined />}
              suffix={
                <div className="growth-indicator">
                  {statsData.orderGrowth > 0 ? (
                    <span className="growth-positive">
                      <RiseOutlined /> {statsData.orderGrowth}%
                    </span>
                  ) : (
                    <span className="growth-negative">
                      <FallOutlined /> {Math.abs(statsData.orderGrowth)}%
                    </span>
                  )}
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总收入"
              value={statsData.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              suffix={
                <div className="growth-indicator">
                  {statsData.revenueGrowth > 0 ? (
                    <span className="growth-positive">
                      <RiseOutlined /> {statsData.revenueGrowth}%
                    </span>
                  ) : (
                    <span className="growth-negative">
                      <FallOutlined /> {Math.abs(statsData.revenueGrowth)}%
                    </span>
                  )}
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card className="main-content-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="概览" key="overview">
            <Row gutter={[16, 16]}>
              {/* 最近订单 */}
              <Col xs={24} lg={16}>
                <Card 
                  title="最近订单" 
                  className="recent-orders-card"
                  extra={
                    <Button type="link" href="/admin/orders">
                      查看全部
                    </Button>
                  }
                >
                  <Table
                    columns={orderColumns}
                    dataSource={recentOrders}
                    pagination={false}
                    size="small"
                    rowKey="id"
                    loading={loading}
                  />
                </Card>
              </Col>

              {/* 系统警告 */}
              <Col xs={24} lg={8}>
                <Card title="系统警告" className="alerts-card">
                  <List
                    dataSource={systemAlerts}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={getAlertIcon(item.type)}
                          title={<Text strong>{item.title}</Text>}
                          description={
                            <div>
                              <div>{item.content}</div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {item.time}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {/* 新用户 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="新注册用户" 
                  className="new-users-card"
                  extra={
                    <Button type="link" href="/admin/users">
                      查看全部
                    </Button>
                  }
                >
                  <List
                    dataSource={recentUsers}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              src={item.avatar} 
                              icon={<UserOutlined />}
                            />
                          }
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text strong>{item.nickname}</Text>
                              <Tag color={getStatusColor(item.status)} className="tag-pill tag-sm tag-bold">
                                {getStatusText(item.status)}
                              </Tag>
                            </div>
                          }
                          description={
                            <div>
                              <div>{item.email}</div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {item.registerTime}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              {/* 系统状态 */}
              <Col xs={24} lg={12}>
                <Card title="系统状态" className="system-status-card">
                  <div className="status-item">
                    <div className="status-label">CPU 使用率</div>
                    <Progress percent={45} status="active" />
                  </div>
                  <div className="status-item">
                    <div className="status-label">内存使用率</div>
                    <Progress percent={67} status="active" />
                  </div>
                  <div className="status-item">
                    <div className="status-label">磁盘使用率</div>
                    <Progress percent={23} />
                  </div>
                  <div className="status-item">
                    <div className="status-label">网络流量</div>
                    <Progress percent={89} status="active" />
                  </div>
                  <Divider />
                  <div className="system-info">
                    <div className="info-item">
                      <Text type="secondary">服务器状态：</Text>
                      <Badge status="success" text="正常运行" />
                    </div>
                    <div className="info-item">
                      <Text type="secondary">数据库状态：</Text>
                      <Badge status="success" text="连接正常" />
                    </div>
                    <div className="info-item">
                      <Text type="secondary">缓存状态：</Text>
                      <Badge status="success" text="运行正常" />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="用户管理" key="users">
            <div className="tab-content">
              <Text>用户管理功能开发中...</Text>
            </div>
          </TabPane>

          <TabPane tab="商品管理" key="products">
            <div className="tab-content">
              <Text>商品管理功能开发中...</Text>
            </div>
          </TabPane>

          <TabPane tab="订单管理" key="orders">
            <div className="tab-content">
              <Text>订单管理功能开发中...</Text>
            </div>
          </TabPane>

          <TabPane tab="系统设置" key="settings">
            <div className="tab-content">
              <Text>系统设置功能开发中...</Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminDashboard;