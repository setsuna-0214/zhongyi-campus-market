import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Upload,
  Input,
  message,
  Spin,
  Image,
  Divider,
  Typography,
  Space,
  Tag
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ShoppingOutlined,
  SolutionOutlined,
  SafetyOutlined,
  SmileOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { getOrderDetail, updateOrderStatus, uploadOrderImages, cancelOrder } from '../../api/orders';
import { canCancelOrder } from '../../utils/labels';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/images';
import './OrderProcess.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

// 自定义进度条组件
const OrderSteps = ({ currentStep, isCancelled, steps }) => {
  return (
    <div className="custom-steps">
      {steps.map((step, index) => {
        const isCompleted = currentStep > index;
        const isCurrent = currentStep === index;
        const isError = isCancelled && isCurrent;
        
        let statusClass = 'wait';
        if (isError) statusClass = 'error';
        else if (isCompleted) statusClass = 'finish';
        else if (isCurrent) statusClass = 'process';
        
        return (
          <div key={index} className={`custom-step ${statusClass}`}>
            <div className="custom-step-icon-wrapper">
              <div className="custom-step-icon">
                {isError ? <CloseCircleOutlined /> : 
                 isCompleted ? <CheckCircleOutlined /> : 
                 step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`custom-step-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
            <div className="custom-step-content">
              <div className="custom-step-title">{step.title}</div>
              {step.description && (
                <div className="custom-step-description">{step.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OrderProcess = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sellerMessage, setSellerMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 获取当前用户ID
  const currentUserId = useMemo(() => {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.id;
      }
    } catch {}
    return null;
  }, []);

  // 判断当前用户角色
  const userRole = useMemo(() => {
    if (!order || !currentUserId) return null;
    const buyerId = order.buyer?.id || order.buyerId;
    const sellerId = order.seller?.id || order.sellerId;
    if (String(buyerId) === String(currentUserId)) return 'buyer';
    if (String(sellerId) === String(currentUserId)) return 'seller';
    return null;
  }, [order, currentUserId]);

  // 加载订单详情
  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
      // 如果有卖家留言，显示出来
      if (data.sellerMessage) {
        setSellerMessage(data.sellerMessage);
      }
      if (data.sellerImages && data.sellerImages.length > 0) {
        setUploadedImages(data.sellerImages.map((url, i) => ({
          uid: `existing-${i}`,
          url,
          status: 'done',
          name: `image-${i}.jpg`
        })));
      }
    } catch (error) {
      message.error('加载订单信息失败');
      navigate('/profile?t=orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // 订单状态映射到步骤
  const getStepStatus = (orderStatus) => {
    const statusMap = {
      'pending': 1,           // 已下单，待卖家处理
      'processing': 1,        // 卖家处理中
      'seller_processed': 2,  // 卖家已处理，待买家确认
      'completed': 3,         // 买家已确认，订单完成
      'cancelled': -1         // 已取消
    };
    return statusMap[orderStatus] || 0;
  };

  const currentStep = useMemo(() => {
    return getStepStatus(order?.status);
  }, [order]);


  // 图片上传处理
  const handleImageChange = ({ fileList }) => {
    setUploadedImages(fileList);
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  // 卖家处理完毕
  const handleSellerProcess = async () => {
    if (!sellerMessage.trim()) {
      message.warning('请填写给买家的留言');
      return;
    }
    setSubmitting(true);
    try {
      // 上传图片
      const imageUrls = [];
      for (const file of uploadedImages) {
        if (file.originFileObj) {
          const formData = new FormData();
          formData.append('image', file.originFileObj);
          const result = await uploadOrderImages(orderId, formData);
          if (result?.url) imageUrls.push(result.url);
        } else if (file.url) {
          imageUrls.push(file.url);
        }
      }
      // 更新订单状态
      await updateOrderStatus(orderId, {
        status: 'seller_processed',
        sellerMessage: sellerMessage.trim(),
        sellerImages: imageUrls
      });
      message.success('处理完毕，等待买家确认');
      loadOrder();
    } catch (error) {
      message.error(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 买家确认订单
  const handleBuyerConfirm = async () => {
    setSubmitting(true);
    try {
      await updateOrderStatus(orderId, { status: 'completed' });
      message.success('订单已确认完成');
      loadOrder();
    } catch (error) {
      message.error(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 买家取消订单
  const handleCancelOrder = async () => {
    if (!canCancelOrder(order?.status)) {
      message.warning('该订单状态无法取消');
      return;
    }
    setSubmitting(true);
    try {
      await cancelOrder(orderId);
      message.success('订单已取消');
      loadOrder();
    } catch (error) {
      message.error(error.message || '取消订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (time) => {
    if (!time) return '';
    try {
      const d = new Date(time);
      return d.toLocaleString('zh-CN');
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="order-process-page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载订单信息..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-process-page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Text type="secondary">订单不存在</Text>
      </div>
    );
  }

  const product = order.product || {};

  return (
    <div className="order-process-page">
      <div className="container">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => {
            // 如果有历史记录则返回上一页，否则跳转到订单列表
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/profile?t=orders');
            }
          }}
          style={{ marginBottom: 16 }}
        >
          返回订单列表
        </Button>

        {/* 商品信息 */}
        <Card className="order-product-card">
          <div className="order-product-info">
            <Image
              src={resolveImageSrc({ product, item: product })}
              alt={product.title}
              width={120}
              height={120}
              fallback={FALLBACK_IMAGE}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
            <div className="order-product-detail">
              <Title level={4}>{product.title || '商品'}</Title>
              <div className="order-product-price">¥{product.price || 0}</div>
              <Tag color="blue">订单号: {orderId}</Tag>
            </div>
          </div>
        </Card>

        {/* 订单进度 */}
        <Card title="订单处理进度" className="order-steps-card">
          <OrderSteps
            currentStep={currentStep}
            isCancelled={order.status === 'cancelled'}
            steps={[
              {
                icon: <ShoppingOutlined />,
                title: '已下单',
                description: currentStep >= 0 ? (
                  <div className="step-detail">
                    <div><UserOutlined /> 买家: {order.buyer?.nickname || order.buyer?.username || '买家'}</div>
                    <div><ClockCircleOutlined /> {formatTime(order.orderTime || order.createdAt)}</div>
                  </div>
                ) : null
              },
              {
                icon: <SolutionOutlined />,
                title: currentStep >= 2 ? '卖家已处理' : '待卖家处理',
                description: currentStep >= 1 ? (
                  <div className="step-detail">
                    {userRole === 'seller' && currentStep === 1 && (
                      <Text type="secondary">请处理订单并留言给买家</Text>
                    )}
                    {(currentStep >= 2 || userRole === 'buyer') && order.sellerMessage && (
                      <div className="seller-message">
                        <Text strong>卖家留言：</Text>
                        <p>{order.sellerMessage}</p>
                      </div>
                    )}
                  </div>
                ) : null
              },
              {
                icon: <SafetyOutlined />,
                title: currentStep >= 3 ? '买家已确认' : '待买家确认',
                description: currentStep >= 2 ? (
                  <div className="step-detail">
                    {userRole === 'buyer' && currentStep === 2 && (
                      <Text type="secondary">请确认订单信息</Text>
                    )}
                  </div>
                ) : null
              },
              {
                icon: <SmileOutlined />,
                title: '订单完成',
                description: currentStep >= 3 ? (
                  <div className="step-detail">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> 交易完成
                  </div>
                ) : null
              }
            ]}
          />
        </Card>


        {/* 卖家操作区域 */}
        {userRole === 'seller' && currentStep === 1 && (
          <Card title="处理订单" className="order-action-card">
            <div className="seller-action-form">
              <div className="form-item">
                <Text strong>上传相关图片（可选）：</Text>
                <Upload
                  listType="picture-card"
                  fileList={uploadedImages}
                  onChange={handleImageChange}
                  onPreview={handlePreview}
                  beforeUpload={() => false}
                  multiple
                >
                  {uploadedImages.length >= 4 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </div>
                  )}
                </Upload>
              </div>
              <div className="form-item">
                <Text strong>给买家留言：</Text>
                <TextArea
                  rows={4}
                  placeholder="请填写交易相关信息，如发货信息、取货地点等..."
                  value={sellerMessage}
                  onChange={(e) => setSellerMessage(e.target.value)}
                  maxLength={500}
                  showCount
                />
              </div>
              <div className="form-actions">
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleSellerProcess}
                >
                  处理完毕
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 卖家已处理，显示信息 */}
        {currentStep >= 2 && order.sellerImages && order.sellerImages.length > 0 && (
          <Card title="卖家上传的图片" className="order-images-card">
            <Image.PreviewGroup>
              <Space wrap>
                {order.sellerImages.map((url, index) => (
                  <Image
                    key={index}
                    src={url}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback={FALLBACK_IMAGE}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </Card>
        )}

        {/* 买家确认区域 */}
        {userRole === 'buyer' && currentStep === 2 && (
          <Card title="确认订单" className="order-action-card">
            <div className="buyer-confirm-section">
              <Text>请确认您已收到商品或服务，确认后订单将完成。</Text>
              <Divider />
              <Space>
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleBuyerConfirm}
                >
                  确认订单
                </Button>
                <Button
                  danger
                  size="large"
                  loading={submitting}
                  onClick={handleCancelOrder}
                >
                  取消订单
                </Button>
              </Space>
            </div>
          </Card>
        )}

        {/* 买家取消订单区域（待卖家处理时） */}
        {userRole === 'buyer' && currentStep === 1 && (
          <Card title="订单操作" className="order-action-card">
            <div className="buyer-cancel-section">
              <Text type="secondary">订单正在等待卖家处理，如需取消请点击下方按钮。</Text>
              <Divider />
              <Button
                danger
                size="large"
                loading={submitting}
                onClick={handleCancelOrder}
              >
                取消订单
              </Button>
            </div>
          </Card>
        )}

        {/* 订单完成 */}
        {currentStep >= 3 && (
          <Card className="order-complete-card">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Title level={4} style={{ marginTop: 16 }}>订单已完成</Title>
              <Text type="secondary">感谢您的使用，祝您生活愉快！</Text>
            </div>
          </Card>
        )}
      </div>

      {/* 图片预览 */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewVisible(visible)
        }}
      />
    </div>
  );
};

export default OrderProcess;
