import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
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
  CheckCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined
} from '@ant-design/icons';
import './Publish.css';
import '../../utils/form-validation.css';
import { CATEGORY_CODE_TO_LABEL, TRADE_METHOD_OPTIONS } from '../../utils/labels';
import { createProduct, getProduct, updateProduct, updateProductStatus } from '../../api/products';
import { generateProductDescription } from '../../api/ai';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

// 支持的图片格式
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/heic', 'image/heif'];
const MAX_IMAGES = 9;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 验证文件魔数（文件头）以确保文件类型真实
const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'image/bmp': [[0x42, 0x4D]],
};

// 四芒星 SVG 图标组件
const SparkleIcon = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="currentColor"
    width="16" 
    height="16"
  >
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const PublishProduct = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams(); // 编辑模式时有商品ID
  const isEditMode = !!productId;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [productStatus, setProductStatus] = useState('在售'); // 商品当前状态
  const [statusLoading, setStatusLoading] = useState(false); // 状态切换加载中
  const [isDragging, setIsDragging] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const fileInputRef = useRef(null);

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
      navigate('/profile?t=products');
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

  // 验证文件格式（包括 MIME 类型和文件大小）
  const validateFile = useCallback((file) => {
    // 检查 MIME 类型
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      message.error(`不支持的文件格式: ${file.name}`);
      return false;
    }
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      message.error(`文件过大: ${file.name}，请选择10MB以内的图片`);
      return false;
    }
    // 检查文件名是否包含危险字符
    if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
      message.error(`文件名包含非法字符: ${file.name}`);
      return false;
    }
    return true;
  }, []);

  // 处理文件选择 - 使用 URL.createObjectURL 避免阻塞
  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const remainingSlots = MAX_IMAGES - imageList.length;
    
    if (fileArray.length > remainingSlots) {
      message.warning(`最多还能上传 ${remainingSlots} 张图片`);
    }
    
    const filesToAdd = fileArray.slice(0, remainingSlots);
    const validFiles = filesToAdd.filter(validateFile);
    
    // 使用 URL.createObjectURL 同步创建预览，避免阻塞
    const newImages = validFiles.map((file, index) => ({
      uid: `upload-${Date.now()}-${index}`,
      name: file.name,
      status: 'done',
      originFileObj: file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));
    
    const updatedList = [...imageList, ...newImages];
    setImageList(updatedList);
    form.setFieldsValue({ images: updatedList.length > 0 ? updatedList : undefined });
  }, [imageList.length, validateFile, form]);

  // 点击上传按钮
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 文件输入变化
  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // 重置input以允许重复选择同一文件
    e.target.value = '';
  };

  // 拖拽处理
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  // 预览图片
  const handlePreview = useCallback((image, index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  }, []);

  // 预览切换
  const handlePreviewPrev = useCallback(() => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  }, [imageList.length]);

  const handlePreviewNext = useCallback(() => {
    setPreviewIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  }, [imageList.length]);

  // 键盘导航
  useEffect(() => {
    if (!previewVisible) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
      } else if (e.key === 'ArrowRight') {
        setPreviewIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        setPreviewVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewVisible, imageList.length]);

  // 删除图片
  const handleDelete = useCallback((uid) => {
    setImageList((prevList) => {
      const imageToDelete = prevList.find(img => img.uid === uid);
      // 清理 Object URL 避免内存泄漏
      if (imageToDelete?.preview && imageToDelete.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      const updatedList = prevList.filter(img => img.uid !== uid);
      form.setFieldsValue({ images: updatedList.length > 0 ? updatedList : undefined });
      return updatedList;
    });
  }, [form]);

  // 组件卸载时清理所有 Object URLs
  useEffect(() => {
    return () => {
      imageList.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  // AI 生成商品描述
  const handleAiGenerate = async () => {
    const title = form.getFieldValue('title');
    const category = form.getFieldValue('category');
    
    // 检查是否有标题或图片
    if (!title && imageList.length === 0) {
      message.warning('请先填写商品标题或上传商品图片');
      return;
    }
    
    setAiGenerating(true);
    
    try {
      // 准备要发送给后端的数据
      const requestData = {
        title: title || '',
        category: category || '',
        images: imageList.map(img => ({
          url: img.url || null,
          preview: img.preview || null,
          isExisting: img.isExisting || false,
        })),
      };
      
      // 调用 AI 接口生成描述
      const result = await generateProductDescription(requestData);
      
      form.setFieldsValue({ description: result.description });
      message.success('描述生成成功，请根据实际情况修改完善');
    } catch (error) {
      message.error(error.message || '生成失败，请稍后重试');
    } finally {
      setAiGenerating(false);
    }
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
          navigate('/profile?t=products');
        } else {
          message.error(result?.message || '更新失败，请重试');
        }
      } else {
        // 新建模式：调用创建 API
        result = await createProduct(formData);
        if (result?.code === 200) {
          message.success('商品发布成功！');
          navigate('/profile?t=products');
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
    <div className="publish-container">
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
                  label={<span className="form-label-decorated">商品标题</span>}
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
                  label={<span className="form-label-decorated">商品分类</span>}
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
                  label={<span className="form-label-decorated">商品图片</span>}
                  rules={[{ required: true, message: '请至少上传一张图片' }]}
                >
                  <div className="custom-image-upload">
                    {/* 隐藏的文件输入 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_FORMATS.join(',')}
                      multiple
                      onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    
                    {/* 图片列表 */}
                    <div className="image-upload-list">
                      {imageList.map((image, index) => (
                        <div key={image.uid} className="image-upload-item">
                          <img
                            src={image.url || image.preview}
                            alt={image.name}
                            className="image-upload-thumbnail"
                          />
                          {index === 0 && (
                            <span className="image-cover-badge">封面</span>
                          )}
                          <div className="image-upload-actions">
                            <button
                              type="button"
                              className="image-action-btn"
                              onClick={() => handlePreview(image, index)}
                              title="预览"
                            >
                              <EyeOutlined />
                            </button>
                            <button
                              type="button"
                              className="image-action-btn"
                              onClick={() => handleDelete(image.uid)}
                              title="删除"
                            >
                              <DeleteOutlined />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* 上传按钮 */}
                      {imageList.length < MAX_IMAGES && (
                        <div
                          className={`image-upload-trigger ${isDragging ? 'dragging' : ''}`}
                          onClick={handleUploadClick}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          <CloudUploadOutlined className="upload-icon" />
                          <span className="upload-text">上传图片</span>
                          <span className="upload-count">{imageList.length}/{MAX_IMAGES}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Text type="secondary">
                    最多上传9张图片，支持 JPG、PNG、WebP、BMP、HEIC 格式，第一张将作为封面
                  </Text>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label={
                    <span className="description-label">
                      商品描述
                      <button
                        type="button"
                        className={`ai-generate-btn ${aiGenerating ? 'generating' : ''}`}
                        onClick={handleAiGenerate}
                        disabled={aiGenerating}
                        title="AI 智能生成描述"
                      >
                        <SparkleIcon className="sparkle-icon" />
                      </button>
                    </span>
                  }
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
                    placeholder="详细描述商品的外观、功能、使用情况等信息（至少10个字符）"
                    showCount
                    maxLength={500}
                    autoSize={{ minRows: 4, maxRows: 8 }}
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
                  label={<span className="form-label-decorated">出售价格</span>}
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
                  label={<span className="form-label-decorated">价格设置</span>}
                  valuePropName="checked"
                >
                  <Checkbox>支持议价</Checkbox>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="tradeMethod"
                  label={<span className="form-label-decorated">交易方式</span>}
                  rules={[{ required: true, message: '请选择交易方式' }]}
                >
                  <Checkbox.Group>
                    <Row gutter={12}>
                      {TRADE_METHOD_OPTIONS.map(opt => (
                        <Col key={opt.value}>
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
                  label={<span className="form-label-decorated">交易地址</span>}
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
                  onClick={() => navigate('/profile?t=products')}
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
        title={null}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        className="image-preview-modal"
        width="auto"
        closable={false}
      >
        <button 
          type="button" 
          className="preview-close-btn" 
          onClick={() => setPreviewVisible(false)}
          aria-label="关闭预览"
        >
          <CloseOutlined />
        </button>
        <div className="preview-content">
          {imageList.length > 1 && (
            <button 
              type="button" 
              className="preview-nav-btn preview-prev" 
              onClick={handlePreviewPrev}
            >
              <LeftOutlined />
            </button>
          )}
          <img 
            alt="preview" 
            className="preview-image" 
            src={imageList[previewIndex]?.url || imageList[previewIndex]?.preview} 
          />
          {imageList.length > 1 && (
            <button 
              type="button" 
              className="preview-nav-btn preview-next" 
              onClick={handlePreviewNext}
            >
              <RightOutlined />
            </button>
          )}
          {imageList.length > 1 && (
            <div className="preview-indicator">
              {previewIndex + 1} / {imageList.length}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PublishProduct;