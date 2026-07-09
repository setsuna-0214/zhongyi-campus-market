/**
 * 求购详情页
 * 展示求购信息、匹配商品和重新匹配按钮
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Tag, Typography, Space, Button, List, message, Spin, Empty, Image, Progress } from 'antd';
import { refreshWantMatches, getWantDetail, getWantMatches } from '../../api/wants';

const { Title, Paragraph, Text } = Typography;
const CATEGORY_LABEL = { electronics: '数码电子', books: '图书教材', daily: '生活用品', other: '其他' };
const STATUS_LABEL = { OPEN: '求购中', MATCHED: '已匹配', CLOSED: '已关闭' };
const STATUS_COLOR = { OPEN: 'blue', MATCHED: 'green', CLOSED: 'default' };
const DEFAULT_PRODUCT_IMAGE = '/images/products/thinkpad.jpg';

function normalizeImage(src) {
  if (!src) return DEFAULT_PRODUCT_IMAGE;
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/${src.replace(/^\/+/, '')}`;
}

export default function WantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [want, setWant] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wantData, matchData] = await Promise.all([
        getWantDetail(id),
        getWantMatches(id),
      ]);
      setWant(wantData);
      setMatches(matchData || []);
    } catch (e) {
      message.error(e.message || '加载求购详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await refreshWantMatches(id);
      setMatches(data || []);
      message.success('已重新匹配');
    } catch (e) {
      message.error(e.message || '重新匹配失败');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64 }}><Spin tip="加载中..." /></div>;
  }
  if (!want) {
    return <div style={{ padding: 48 }}><Empty description="求购信息不存在" /></div>;
  }

  return (
    <div className="forum-page">
      <div className="forum-container">
        <Card className="post-detail-card">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Title level={2} style={{ marginBottom: 8 }}>{want.title}</Title>
              <Space wrap>
                <Tag color="blue">{CATEGORY_LABEL[want.category] || want.category || '未分类'}</Tag>
                <Tag color={STATUS_COLOR[want.status] || 'default'}>{STATUS_LABEL[want.status] || want.status}</Tag>
                {want.urgency && <Tag color={want.urgency === '高' ? 'red' : want.urgency === '中' ? 'orange' : 'default'}>{want.urgency}</Tag>}
                {want.expectedCondition && <Tag color="purple">期望成色：{want.expectedCondition}</Tag>}
              </Space>
            </div>
            <Text type="secondary">发布者：{want.username}</Text>
            <Text>预算：¥{want.minPrice ?? 0} - ¥{want.maxPrice ?? '不限'}</Text>
            {want.keywords && <Text>关键词：{want.keywords}</Text>}
            <Paragraph>{want.description || '暂无描述'}</Paragraph>
            <div>
              <Button type="primary" onClick={handleRefresh} loading={refreshing}>重新匹配</Button>
            </div>
          </Space>
        </Card>

        <Card title={`匹配商品（${matches.length}）`} className="comments-card" style={{ marginTop: 16 }}>
          {matches.length === 0 ? (
            <Empty description="暂无符合条件的匹配商品，可以调整预算、分类或补充关键词后重新匹配" />
          ) : (
            <List
              dataSource={matches}
              renderItem={(item) => (
                <List.Item onClick={() => navigate(`/products/${item.productId}`)} style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                  <Image
                    src={normalizeImage(item.picture)}
                    alt={item.title}
                    width={88}
                    height={88}
                    preview={false}
                    style={{ objectFit: 'cover', borderRadius: 8, marginRight: 16, background: '#f5f5f5' }}
                  />
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <span>{item.title}</span>
                        <Tag color="green">智能推荐</Tag>
                        <Tag color="blue">{item.sellerName || '卖家'}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={6}>
                        <Space wrap>
                          <Text strong>¥{item.price}</Text>
                          <Text type="secondary">{CATEGORY_LABEL[item.category] || item.category || '未分类'}</Text>
                        </Space>
                        <Progress
                          percent={Math.min(item.matchScore || 0, 100)}
                          size="small"
                          format={() => `${item.matchScore || 0} 分`}
                        />
                        <Space wrap>
                          {(item.matchReasons || []).map((reason, idx) => <Tag key={`${item.productId}-${idx}`}>{reason}</Tag>)}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
