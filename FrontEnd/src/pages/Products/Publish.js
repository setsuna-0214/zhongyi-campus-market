import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Modal
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import './Publish.css';
import { CATEGORY_CODE_TO_LABEL } from '../../utils/labels';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const PublishProduct = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 商品分类数据
  const categories = Object.entries(CATEGORY_CODE_TO_LABEL).map(([value, label]) => ({ value, label }));

  // 图片上传处理
  const handleImageChange = ({ fileList }) => {
    setImageList(fileList);
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
  const handleSubmit = async (_values) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('商品发布成功！');
      navigate('/search?type=products');
    } catch (error) {
      message.error('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="page-container publish-container">
      <div className="publish-header">
        <Title level={2}>发布商品</Title>
        <Text type="secondary">发布你的闲置物品，让它们找到新主人</Text>
      </div>

      <Card className="publish-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="publish-form"
        >
          <Card title="商品信息" className="step-card">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="商品标题"
                  rules={[
                    { required: true, message: '请输入商品标题' },
                    { max: 50, message: '标题不能超过50个字符' }
                  ]}
                >
                  <Input placeholder="请输入商品标题" showCount maxLength={50} />
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
                    { min: 10, message: '描述至少10个字符' }
                  ]}
                >
                  <TextArea
                    rows={6}
                    placeholder="详细描述商品的外观、功能、使用情况等信息"
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
                    { type: 'number', min: 0.01, message: '价格必须大于0' }
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
                      <Col span={12}>
                        <Checkbox value="campus">校内交易</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="express">快递邮寄</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="pickup">自提</Checkbox>
                      </Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="location"
                  label="交易地址"
                  rules={[{ required: true, message: '请输入交易地址' }]}
                >
                  <Input placeholder="请输入具体的交易地址或区域" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="contactMethod"
                  label="联系方式"
                  rules={[{ required: true, message: '请选择联系方式' }]}
                >
                  <Select placeholder="请选择联系方式">
                    <Option value="phone">电话联系</Option>
                    <Option value="platform">站内私信</Option>
                  </Select>
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
              确认发布
            </Button>
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