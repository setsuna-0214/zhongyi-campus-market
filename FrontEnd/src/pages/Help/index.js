import React, { useState } from 'react';
import { 
  Typography, 
  Collapse, 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Space,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  QuestionCircleOutlined,
  ShoppingOutlined,
  SafetyOutlined,
  MessageOutlined,
  UserOutlined,
  SendOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import './index.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const Help = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 常见问题数据
  const faqData = [
    {
      category: '账户相关',
      icon: <UserOutlined />,
      questions: [
        {
          q: '如何注册账号？',
          a: '点击首页的"注册"按钮，填写用户名、校园邮箱和密码，完成邮箱验证即可注册成功。'
        },
        {
          q: '忘记密码怎么办？',
          a: '在登录页面点击"忘记密码"，输入注册时使用的邮箱，通过邮箱验证码即可重置密码。'
        },
        {
          q: '如何修改个人信息？',
          a: '登录后进入"个人中心"，点击编辑按钮即可修改昵称、头像、联系方式等信息。'
        }
      ]
    },
    {
      category: '商品交易',
      icon: <ShoppingOutlined />,
      questions: [
        {
          q: '如何发布商品？',
          a: '登录后点击右下角的"+"按钮或导航栏的"发布"，填写商品信息（标题、价格、分类、描述、图片等）即可发布。'
        },
        {
          q: '如何购买商品？',
          a: '浏览商品详情页，点击"立即购买"按钮创建订单，然后与卖家沟通交易细节。'
        },
        {
          q: '支持哪些交易方式？',
          a: '平台支持两种交易方式：校内自提（面交）和快递邮寄，具体方式由买卖双方协商确定。'
        },
        {
          q: '如何修改或删除已发布的商品？',
          a: '进入"个人中心" > "我发布的"，找到对应商品，点击编辑或删除按钮即可操作。'
        }
      ]
    },
    {
      category: '订单管理',
      icon: <SafetyOutlined />,
      questions: [
        {
          q: '订单状态有哪些？',
          a: '订单状态包括：待卖家处理、待买家确认、已完成、已取消。买家创建订单后，需等待卖家处理，卖家处理后买家确认收货即完成交易。'
        },
        {
          q: '如何取消订单？',
          a: '在订单确认收货前，买家可以在订单详情页点击"取消订单"按钮取消交易。'
        },
        {
          q: '订单完成后可以删除吗？',
          a: '已取消的订单可以删除，已完成的订单会保留在历史记录中。'
        }
      ]
    },
    {
      category: '消息沟通',
      icon: <MessageOutlined />,
      questions: [
        {
          q: '如何联系卖家？',
          a: '在商品详情页点击"联系卖家"按钮，即可进入聊天页面与卖家沟通。'
        },
        {
          q: '消息支持发送图片吗？',
          a: '支持，在聊天界面点击图片图标即可上传并发送图片。'
        },
        {
          q: '如何查看历史消息？',
          a: '点击右下角的消息图标或导航栏进入消息页面，选择对应的会话即可查看历史消息。'
        }
      ]
    }
  ];

  // 提交反馈
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('感谢您的反馈，我们会尽快处理！');
      form.resetFields();
    } catch {
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container help-page">
      <div className="help-header">
        <Title level={2}>
          <QuestionCircleOutlined /> 帮助与反馈
        </Title>
        <Paragraph type="secondary">
          在这里您可以找到常见问题的解答，或向我们提交反馈意见
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 常见问题 */}
        <Col xs={24} lg={14}>
          <Card className="faq-card">
            <Title level={4}>常见问题</Title>
            <Collapse 
              accordion 
              bordered={false}
              className="faq-collapse"
              expandIconPosition="end"
            >
              {faqData.map((category, idx) => (
                <Panel 
                  header={
                    <Space>
                      {category.icon}
                      <Text strong>{category.category}</Text>
                    </Space>
                  } 
                  key={idx}
                  className="faq-category-panel"
                >
                  <Collapse bordered={false} className="faq-questions">
                    {category.questions.map((item, qIdx) => (
                      <Panel header={item.q} key={qIdx}>
                        <Paragraph>{item.a}</Paragraph>
                      </Panel>
                    ))}
                  </Collapse>
                </Panel>
              ))}
            </Collapse>
          </Card>
        </Col>

        {/* 反馈表单 */}
        <Col xs={24} lg={10}>
          <Card className="feedback-card">
            <Title level={4}>意见反馈</Title>
            <Paragraph type="secondary">
              如果您有任何建议或遇到问题，欢迎告诉我们
            </Paragraph>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="type"
                label="反馈类型"
                rules={[{ required: true, message: '请选择反馈类型' }]}
              >
                <Input placeholder="如：功能建议、Bug反馈、使用问题等" />
              </Form.Item>

              <Form.Item
                name="content"
                label="反馈内容"
                rules={[{ required: true, message: '请输入反馈内容' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请详细描述您的问题或建议..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="contact"
                label="联系方式（选填）"
              >
                <Input placeholder="邮箱或手机号，方便我们回复您" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  icon={<SendOutlined />}
                  block
                >
                  提交反馈
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 联系我们 */}
          <Card className="contact-card">
            <Title level={4}>联系我们</Title>
            <Space direction="vertical" size="middle">
              <div className="contact-item">
                <MailOutlined />
                <Text>zhangjt85@mail2.sysu.edu.cn</Text>
              </div>
              <div className="contact-item">
                <PhoneOutlined />
                <Text>400-123-4567</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 底部说明 */}
      <div className="help-footer">
        <Paragraph type="secondary">
          中易校园交易平台 · 为校园师生提供安全便捷的交易服务
        </Paragraph>
      </div>
    </div>
  );
};

export default Help;
