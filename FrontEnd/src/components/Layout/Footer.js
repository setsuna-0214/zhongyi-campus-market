import React from 'react';
import { Layout, Row, Col, Space, Divider } from 'antd';
import { 
  WechatOutlined, 
  QqOutlined, 
  WeiboOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import './Footer.css';

const { Footer: AntFooter } = Layout;

const Footer = () => {
  return (
    <AntFooter className="app-footer">
      <div className="footer-content">
        <Row gutter={[48, 24]} align="top">
          {/* 关于我们 */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div className="footer-section">
              <h4 className="footer-title">关于中易</h4>
              <div className="footer-links">
                <a href="/about">平台介绍</a>
                <a href="/help">使用帮助</a>
                <a href="/safety">安全保障</a>
                <a href="/rules">交易规则</a>
              </div>
            </div>
          </Col>

          {/* 服务支持 */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div className="footer-section">
              <h4 className="footer-title">服务支持</h4>
              <div className="footer-links">
                <a href="/contact">联系我们</a>
                <a href="/feedback">意见反馈</a>
                <a href="/report">举报投诉</a>
                <a href="/faq">常见问题</a>
              </div>
            </div>
          </Col>

          {/* 联系方式 */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div className="footer-section">
              <h4 className="footer-title">联系方式</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <PhoneOutlined />
                  <span>400-123-4567</span>
                </div>
                <div className="contact-item">
                  <MailOutlined />
                  <span>support@zhongyi.edu</span>
                </div>
                <div className="contact-item">
                  <EnvironmentOutlined />
                  <span>校园服务中心</span>
                </div>
              </div>
            </div>
          </Col>

          {/* 关注我们 */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div className="footer-section">
              <h4 className="footer-title">关注我们</h4>
              <div className="social-links">
                <Space size="large">
                  <WechatOutlined className="social-icon" />
                  <QqOutlined className="social-icon" />
                  <WeiboOutlined className="social-icon" />
                </Space>
              </div>
              <div className="qr-code">
                <div className="qr-placeholder">
                  <span>微信公众号</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* 底部信息 */}
        <div className="footer-bottom">
          <Row justify="space-between" align="middle">
            <Col xs={24} md={12}>
              <div className="copyright">
                <p>© 2024 中易校园二手交易平台. All rights reserved.</p>
                <p>仅限校园内部使用 | 学生认证交易平台</p>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="footer-links-bottom">
                <a href="/privacy">隐私政策</a>
                <a href="/terms">服务条款</a>
                <a href="/license">许可协议</a>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;