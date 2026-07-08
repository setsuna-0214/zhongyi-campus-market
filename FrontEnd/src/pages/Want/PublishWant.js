/**
 * 发布求购页
 */

import { Form, Input, Button, Card, InputNumber, Select, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createWant } from '../../api/wants';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { label: '数码电子', value: 'electronics' },
  { label: '图书教材', value: 'books' },
  { label: '生活用品', value: 'daily' },
  { label: '其他', value: 'other' },
];
const URGENCY_OPTIONS = [
  { label: '低', value: '低' },
  { label: '中', value: '中' },
  { label: '高', value: '高' },
];
const CONDITION_OPTIONS = [
  { label: '不限', value: '不限' },
  { label: '全新', value: '全新' },
  { label: '九成新', value: '九成新' },
  { label: '八成新', value: '八成新' },
  { label: '能用即可', value: '能用即可' },
];

export default function PublishWant() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const res = await createWant(values);
      message.success(res?.message || '发布成功');
      navigate(`/wants/${res?.data?.id || res?.id || ''}`);
    } catch (e) {
      message.error(e.message || '发布失败');
    }
  };

  return (
    <div className="publish-post-page">
      <div className="publish-post-container">
        <div className="publish-post-header">
          <Title level={2}>发布求购</Title>
          <Text type="secondary">填写你的购买需求，系统会自动匹配可能合适的商品</Text>
        </div>

        <Card className="publish-post-card">
          <Form form={form} layout="vertical" onFinish={handleSubmit} className="publish-form form-input-style">
            <Form.Item name="title" label="求购标题" rules={[{ required: true, message: '请输入求购标题' }]}>
              <Input placeholder="例如：求购蓝牙耳机 / 求购高数教材" maxLength={100} showCount />
            </Form.Item>

            <Form.Item name="description" label="求购描述" rules={[{ required: true, message: '请输入求购描述' }]}>
              <TextArea placeholder="详细说明你的需求、用途、品牌偏好等" autoSize={{ minRows: 6, maxRows: 12 }} maxLength={1000} showCount />
            </Form.Item>

            <Form.Item name="category" label="商品分类" rules={[{ required: true, message: '请选择商品分类' }]}>
              <Select options={CATEGORY_OPTIONS} placeholder="请选择分类" />
            </Form.Item>

            <Form.Item label="预算范围">
              <Input.Group compact>
                <Form.Item name="minPrice" noStyle>
                  <InputNumber style={{ width: '48%' }} min={0} precision={2} placeholder="最低预算" />
                </Form.Item>
                <span style={{ display: 'inline-block', width: '4%', textAlign: 'center' }}>-</span>
                <Form.Item name="maxPrice" noStyle>
                  <InputNumber style={{ width: '48%' }} min={0} precision={2} placeholder="最高预算" />
                </Form.Item>
              </Input.Group>
            </Form.Item>

            <Form.Item name="keywords" label="关键词">
              <Input placeholder="多个关键词用逗号分隔，例如：耳机,蓝牙,降噪" />
            </Form.Item>

            <Form.Item name="expectedCondition" label="期望成色" initialValue="不限">
              <Select options={CONDITION_OPTIONS} />
            </Form.Item>

            <Form.Item name="urgency" label="紧急程度" initialValue="中">
              <Select options={URGENCY_OPTIONS} />
            </Form.Item>

            <div className="step-actions">
              <Button type="primary" htmlType="submit">确认发布</Button>
              <Button style={{ marginLeft: 12 }} onClick={() => navigate(-1)}>取消</Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}