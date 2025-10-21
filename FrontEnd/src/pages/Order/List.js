import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  Rate, 
  message,
  Divider,
  Image,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  MessageOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './List.css';
import { listOrders, getOrderStats, confirmReceived, cancelOrder, submitReview } from '../../api/orders';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: null,
    keyword: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  });

  // 订单数据改为从后端获取

  // 获取订单列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        status: filters.status || undefined,
        keyword: filters.keyword || undefined,
        startDate: filters.dateRange?.[0]?.toISOString?.(),
        endDate: filters.dateRange?.[1]?.toISOString?.(),
      };
      const data = await listOrders(params);
      setOrders(Array.isArray(data) ? data : []);
      try {
        const s = await getOrderStats();
        setStats({
          total: s?.total || 0,
          pending: s?.pending || 0,
          completed: s?.completed || 0,
          cancelled: s?.cancelled || 0,
        });
      } catch {
        // 统计接口不可用时，根据订单列表计算
        setStats({
          total: data.length,
          pending: data.filter(o => o.status === 'pending').length,
          completed: data.filter(o => o.status === 'completed').length,
          cancelled: data.filter(o => o.status === 'cancelled').length,
        });
      }
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  // 处理搜索
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
  };

  // 处理状态筛选
  const handleStatusFilter = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  // 查看订单详情
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  // 联系卖家
  const handleContactSeller = (order) => {
    navigate(`/chat?sellerId=${order.seller.id}&orderId=${order.id}`);
  };

  // 确认收货
  const handleConfirmReceived = async (orderId) => {
    try {
      await confirmReceived(orderId);
      message.success('确认收货成功');
      fetchOrders();
    } catch (error) {
      message.error('确认收货失败');
    }
  };

  // 取消订单
  const handleCancelOrder = async (orderId) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '取消后无法恢复，确定要取消这个订单吗？',
      onOk: async () => {
        try {
          await cancelOrder(orderId);
          message.success('订单已取消');
          fetchOrders();
        } catch (error) {
          message.error('取消订单失败');
        }
      }
    });
  };

  // 评价商品
  const handleReview = (order) => {
    setSelectedOrder(order);
    setReviewData({ rating: 5, comment: '' });
    setReviewVisible(true);
  };

  // 提交评价
  const handleSubmitReview = async () => {
    try {
      await submitReview(selectedOrder.id, reviewData);
      message.success('评价提交成功');
      setReviewVisible(false);
      fetchOrders();
    } catch (error) {
      message.error('评价提交失败');
    }
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待发货' },
      shipped: { color: 'blue', text: '已发货' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' }
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取操作按钮
  const getActionButtons = (order) => {
    const buttons = [];
    
    buttons.push(
      <Button 
        key="detail" 
        type="link" 
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(order)}
      >
        详情
      </Button>
    );

    if (order.status !== 'cancelled') {
      buttons.push(
        <Button 
          key="contact" 
          type="link" 
          icon={<MessageOutlined />}
          onClick={() => handleContactSeller(order)}
        >
          联系卖家
        </Button>
      );
    }

    if (order.status === 'pending') {
      buttons.push(
        <Button 
          key="cancel" 
          type="link" 
          danger
          onClick={() => handleCancelOrder(order.id)}
        >
          取消订单
        </Button>
      );
    }

    if (order.status === 'shipped') {
      buttons.push(
        <Button 
          key="confirm" 
          type="link"
          onClick={() => handleConfirmReceived(order.id)}
        >
          确认收货
        </Button>
      );
    }

    if (order.status === 'completed' && !order.hasReviewed) {
      buttons.push(
        <Button 
          key="review" 
          type="link" 
          icon={<StarOutlined />}
          onClick={() => handleReview(order)}
        >
          评价
        </Button>
      );
    }

    return buttons;
  };

  const columns = [
    {
      title: '商品信息',
      key: 'product',
      width: 300,
      render: (_, order) => (
        <div className="product-info">
          <Image
            src={order.productImage}
            alt={order.productName}
            width={60}
            height={60}
            style={{ borderRadius: 4 }}
          />
          <div className="product-details">
            <div className="product-name">{order.productName}</div>
            <div className="seller-info">
              卖家：{order.seller.name}
            </div>
            <div className="price-info">
              ¥{order.price} × {order.quantity}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: '总金额',
      key: 'totalAmount',
      width: 100,
      render: (_, order) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          ¥{order.totalAmount}
        </Text>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, order) => getStatusTag(order.status)
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      key: 'orderTime',
      width: 150
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, order) => (
        <Space size="small" wrap>
          {getActionButtons(order)}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container order-list-container">
      {/* 统计卡片 */}
      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <Card>
            <Statistic
              title="全部订单"
              value={stats.total}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待发货"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已取消"
              value={stats.cancelled}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card className="order-list-card">
        <div className="order-list-header">
          <Title level={4}>我的订单</Title>
          
          {/* 搜索和筛选 */}
          <div className="search-filters">
            <Space size="middle">
              <Input.Search
                placeholder="搜索订单号或商品名称"
                allowClear
                style={{ width: 250 }}
                onSearch={handleSearch}
              />
              
              <Select
                placeholder="订单状态"
                allowClear
                style={{ width: 120 }}
                onChange={handleStatusFilter}
              >
                <Option value="pending">待发货</Option>
                <Option value="shipped">已发货</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
              
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                style={{ width: 250 }}
                onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              />
            </Space>
          </div>
        </div>

        <Divider />

        {/* 订单列表 */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            total: orders.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无订单"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
        className="order-detail-modal"
      >
        {selectedOrder && (
          <div className="order-detail-content">
            <div className="detail-section">
              <Title level={5}>商品信息</Title>
              <div className="product-detail">
                <Image
                  src={selectedOrder.productImage}
                  alt={selectedOrder.productName}
                  width={80}
                  height={80}
                />
                <div className="product-info">
                  <div className="product-name">{selectedOrder.productName}</div>
                  <div className="price-quantity">
                    ¥{selectedOrder.price} × {selectedOrder.quantity}
                  </div>
                  <div className="total-amount">
                    总计：¥{selectedOrder.totalAmount}
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div className="detail-section">
              <Title level={5}>订单信息</Title>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary">订单号：</Text>
                  <Text>{selectedOrder.id}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">状态：</Text>
                  {getStatusTag(selectedOrder.status)}
                </Col>
                <Col span={12}>
                  <Text type="secondary">下单时间：</Text>
                  <Text>{selectedOrder.orderTime}</Text>
                </Col>
                {selectedOrder.paymentTime && (
                  <Col span={12}>
                    <Text type="secondary">支付时间：</Text>
                    <Text>{selectedOrder.paymentTime}</Text>
                  </Col>
                )}
                {selectedOrder.shippingTime && (
                  <Col span={12}>
                    <Text type="secondary">发货时间：</Text>
                    <Text>{selectedOrder.shippingTime}</Text>
                  </Col>
                )}
                {selectedOrder.deliveryTime && (
                  <Col span={12}>
                    <Text type="secondary">收货时间：</Text>
                    <Text>{selectedOrder.deliveryTime}</Text>
                  </Col>
                )}
                {selectedOrder.trackingNumber && (
                  <Col span={12}>
                    <Text type="secondary">快递单号：</Text>
                    <Text>{selectedOrder.trackingNumber}</Text>
                  </Col>
                )}
              </Row>
            </div>

            <Divider />

            <div className="detail-section">
              <Title level={5}>收货地址</Title>
              <Text>{selectedOrder.shippingAddress}</Text>
            </div>

            {selectedOrder.cancelReason && (
              <>
                <Divider />
                <div className="detail-section">
                  <Title level={5}>取消原因</Title>
                  <Text>{selectedOrder.cancelReason}</Text>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 评价弹窗 */}
      <Modal
        title="商品评价"
        open={reviewVisible}
        onOk={handleSubmitReview}
        onCancel={() => setReviewVisible(false)}
        okText="提交评价"
        cancelText="取消"
      >
        {selectedOrder && (
          <div className="review-content">
            <div className="product-info">
              <Image
                src={selectedOrder.productImage}
                alt={selectedOrder.productName}
                width={60}
                height={60}
              />
              <div className="product-name">{selectedOrder.productName}</div>
            </div>
            
            <Divider />
            
            <div className="rating-section">
              <Text>商品评分：</Text>
              <Rate
                value={reviewData.rating}
                onChange={(value) => setReviewData(prev => ({ ...prev, rating: value }))}
              />
            </div>
            
            <div className="comment-section">
              <Text>评价内容：</Text>
              <TextArea
                rows={4}
                placeholder="请输入您的评价..."
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                maxLength={200}
                showCount
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;