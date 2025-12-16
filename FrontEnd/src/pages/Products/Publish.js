import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Card,
  Row,
  Col,
  message,
  Checkbox,
  Typography,
  Alert,
  Modal,
  Spin
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import './Publish.css';
import { CATEGORY_CODE_TO_LABEL, TRADE_METHOD_OPTIONS } from '../../utils/labels';
import { createProduct, getProduct, updateProduct, updateProductStatus } from '../../api/products';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const PublishProduct = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams(); // 编辑模式时有商品ID
  const isEditMode = !!productId;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [productStatus, setProductStatus] = useState('在售'); // 商品当前状态
  const [statusLoading, setStatusLoading] = useState(false); // 状态切换加载中

  // 商品分类数据
  const categories = Object.entries(CATEGORY_CODE_TO_LABEL).map(([value, label]) => ({ value, label }));

  // 编辑模式：加载商品数据
  const loadProductData = useCallback(async () => {
    if (!productId) return;
    setInitialLoading(true);
    try {
      const product = await getProduct(productId);
      // 填充表单数据
      form.setFieldsValue({
        title: product.title,
        category: product.category,
        description: product.description,
        price: product.price,
        negotiable: product.negotiable,
        tradeMethod: product.tradeMethod 
          ? (Array.isArray(product.tradeMethod) ? product.tradeMethod : product.tradeMethod.split(',').map(s => s.trim()))
          : [],
        location: product.location,
      });
      // 保存商品当前状态
      setProductStatus(product.status || '在售');
      // 处理已有图片
      if (product.images && product.images.length > 0) {
        const existingImages = product.images.map((url, index) => ({
          uid: `existing-${index}`,
          name: `image-${index}.jpg`,
          status: 'done',
          url: url,
          isExisting: true, // 标记为已有图片
        }));
        setImageList(existingImages);
        form.setFieldsValue({ images: existingImages });
      }
    } catch (error) {
      message.error('加载商品信息失败');
      navigate('/user?tab=products');
    } finally {
      setInitialLoading(false);
    }
  }, [productId, form, navigate]);

  // 切换商品上架/下架状态
  const handleToggleStatus = async () => {
    if (!productId) return;
    // 已售出的商品不能切换状态
    if (productStatus === '已售出' || productStatus === 'sold') {
      message.warning('已售出的商品无法修改状态');
      return;
    }
    const newStatus = (productStatus === '在售' || productStatus === 'available') ? '已下架' : '在售';
    setStatusLoading(true);
    try {
      const result = await updateProductStatus(productId, newStatus);
      if (result?.code === 200) {
        setProductStatus(newStatus);
        message.success(newStatus === '在售' ? '商品已重新上架' : '商品已下架');
      } else {
        message.error(result?.message || '操作失败');
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      loadProductData();
    }
  }, [isEditMode, loadProductData]);

  // 图片上传处理
  const handleImageChange = ({ fileList }) => {
    setImageList(fileList);
    // 同步更新表单字段，使验证能够识别到图片
    form.setFieldsValue({ images: fileList.length > 0 ? fileList : undefined });
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // 表单提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 构建 FormData
      const formData = new FormData();
      formData.append('pro_name', values.title);
      formData.append('price', String(values.price));
      formData.append('category', values.category || 'other');
      formData.append('discription', values.description || '');
      formData.append('location', values.location || '');
      // 交易方式：数组转为逗号分隔的字符串
      if (values.tradeMethod && values.tradeMethod.length > 0) {
        formData.append('tradeMethod', values.tradeMethod.join(','));
      }
      // 是否支持议价
      formData.append('negotiable', values.negotiable ? 'true' : 'false');
      
      // 添加图片文件
      if (imageList && imageList.length > 0) {
        // 已有图片的URL列表
        const existingImageUrls = imageList
          .filter(file => file.isExisting && file.url)
          .map(file => file.url);
        if (existingImageUrls.length > 0) {
          formData.append('existingImages', JSON.stringify(existingImageUrls));
        }
        // 新上传的图片
        imageList.forEach((file) => {
          if (file.originFileObj) {
            formData.append('images', file.originFileObj);
          }
        });
      }

      let result;
      if (isEditMode) {
        // 编辑模式：调用更新 API
        result = await updateProduct(productId, formData);
        if (result?.code === 200) {
          message.success('商品更新成功！');
          navigate('/user?tab=products');
        } else {
          message.error(result?.message || '更新失败，请重试');
        }
      } else {
        // 新建模式：调用创建 API
        result = await createProduct(formData);
        if (result?.code === 200) {
          message.success('商品发布成功！');
          navigate('/user?tab=products');
        } else {
          message.error(result?.message || '发布失败，请重试');
        }
      }
    } catch (error) {
      message.error(error.message || (isEditMode ? '更新失败，请重试' : '发布失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  

  if (initialLoading) {
    return (
      <div className="page-container publish-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载商品信息中..." />
      </div>
    );
  }

  return (
    <div className="page-container publish-container">
      <div className="publish-header">
        <Title level={2}>{isEditMode ? '编辑商品' : '发布商品'}</Title>
        <Text type="secondary">
          {isEditMode ? '修改商品信息后点击保存' : '发布你的闲置物品，让它们找到新主人'}
        </Text>
      </div>

      <Card className="publish-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={(errorInfo) => {
            console.log('表单验证失败:', errorInfo);
            const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
            message.error(firstError || '请填写所有必填项并确保信息正确');
          }}
          className="publish-form"
          scrollToFirstError
          validateTrigger={['onChange', 'onBlur']}
        >
          <Card title="商品信息" className="step-card">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="商品标题"
                  rules={[
                    { required: true, message: '请输入商品标题' },
                    { min: 2, message: '标题至少2个字符' },
                    { max: 50, message: '标题不能超过50个字符' },
                    {
                      validator: (_, value) => {
                        if (value && /^[\s]+$/.test(value)) {
                          return Promise.reject(new Error('标题不能只包含空格'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input placeholder="请输入商品标题（2-50个字符）" showCount maxLength={50} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="商品分类"
                  rules={[{ required: true, message: '请选择商品分类' }]}
                >
                  <Select placeholder="请选择分类">
                    {categories.map(cat => (
                      <Option key={cat.value} value={cat.value}>
                        {cat.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="images"
                  label="商品图片"
                  rules={[{ required: true, message: '请至少上传一张图片' }]}
                >
                  <Upload
                    listType="picture-card"
                    fileList={imageList}
                    onChange={handleImageChange}
                    onPreview={handlePreview}
                    beforeUpload={() => false}
                    multiple
                  >
                    {imageList.length >= 8 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>上传图片</div>
                      </div>
                    )}
                  </Upload>
                  <Text type="secondary">
                    最多上传8张图片，支持JPG、PNG格式
                  </Text>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label="商品描述"
                  rules={[
                    { required: true, message: '请输入商品描述' },
                    { min: 10, message: '描述至少10个字符，请详细描述商品信息' },
                    { max: 500, message: '描述不能超过500个字符' },
                    {
                      validator: (_, value) => {
                        if (value && /^[\s]+$/.test(value)) {
                          return Promise.reject(new Error('描述不能只包含空格'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <TextArea
                    rows={6}
                    placeholder="详细描述商品的外观、功能、使用情况等信息（至少10个字符）"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="交易设置" className="step-card">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="price"
                  label="出售价格"
                  rules={[
                    { required: true, message: '请输入出售价格' },
                    { type: 'number', min: 0.01, message: '价格必须大于0' },
                    {
                      validator: (_, value) => {
                        if (value !== undefined && value !== null) {
                          if (value < 0.01) {
                            return Promise.reject(new Error('价格必须大于0'));
                          }
                          if (value > 1000000) {
                            return Promise.reject(new Error('价格不能超过1000000元'));
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    placeholder="请输入价格"
                    style={{ width: '100%' }}
                    min={0.01}
                    precision={2}
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/¥\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="negotiable"
                  label="价格设置"
                  valuePropName="checked"
                >
                  <Checkbox>支持议价</Checkbox>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="tradeMethod"
                  label="交易方式"
                  rules={[{ required: true, message: '请选择交易方式' }]}
                >
                  <Checkbox.Group>
                    <Row>
                      {TRADE_METHOD_OPTIONS.map(opt => (
                        <Col span={20} key={opt.value}>
                          <Checkbox value={opt.value}>{opt.label}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="location"
                  label="交易地址"
                  rules={[
                    { required: true, message: '请输入交易地址' },
                    { min: 2, message: '地址至少2个字符' },
                    { max: 100, message: '地址不能超过100个字符' }
                  ]}
                >
                  <Input placeholder="请输入具体的交易地址或区域" maxLength={100} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="发布确认" className="step-card">
            <Alert
              message="发布须知"
              description={
                <div>
                  <p>• 请确保商品信息真实有效，虚假信息将被删除</p>
                  <p>• 禁止发布违法违规商品</p>
                  <p>• 交易过程中请注意安全，建议当面交易</p>
                  <p>• 发布后可在个人中心管理商品信息</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          </Card>

          <div className="step-actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              {isEditMode ? '保存修改' : '确认发布'}
            </Button>
            {isEditMode && (
              <>
                {/* 上架/下架按钮 - 仅编辑模式显示，已售出商品不显示 */}
                {productStatus !== '已售出' && productStatus !== 'sold' && (
                  <Button
                    style={{ marginLeft: 12 }}
                    danger={productStatus === '在售' || productStatus === 'available'}
                    loading={statusLoading}
                    onClick={handleToggleStatus}
                  >
                    {(productStatus === '在售' || productStatus === 'available') ? '下架商品' : '重新上架'}
                  </Button>
                )}
                <Button
                  style={{ marginLeft: 12 }}
                  onClick={() => navigate('/user?tab=products')}
                >
                  取消
                </Button>
              </>
            )}
          </div>
        </Form>
      </Card>

      <Modal
        open={previewVisible}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default PublishProduct;