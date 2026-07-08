/**
 * 求购大厅
 * 展示所有求购信息，支持分类/状态筛选
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Tag, Button, Empty, Space, Pagination, Spin, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listWants } from '../../api/wants';
import { isLoggedIn } from '../../utils/auth';

const { Title, Text, Paragraph } = Typography;

const CATEGORY_OPTIONS = [
  { label: '全部', value: '' },
  { label: '数码电子', value: 'electronics' },
  { label: '图书教材', value: 'books' },
  { label: '生活用品', value: 'daily' },
  { label: '其他', value: 'other' },
];

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '求购中', value: 'OPEN' },
  { label: '已匹配', value: 'MATCHED' },
  { label: '已关闭', value: 'CLOSED' },
];

const CATEGORY_LABEL = {
  electronics: '数码电子',
  books: '图书教材',
  daily: '生活用品',
  other: '其他',
};
const URGENCY_COLOR = { 低: 'default', 中: 'orange', 高: 'red' };
const STATUS_COLOR = { OPEN: 'blue', MATCHED: 'green', CLOSED: 'default' };
const STATUS_LABEL = { OPEN: '求购中', MATCHED: '已匹配', CLOSED: '已关闭' };

export default function WantsHome() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: '', status: '' });
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWants({ ...filters, page, pageSize });
      setData(res || { items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="forum-page">
      <div className="forum-container">
        <div className="forum-hero">
          <Title level={2} className="forum-title">求购大厅</Title>
          <Text className="forum-subtitle">发布你的购买需求，让系统自动帮你匹配商品</Text>
          {isLoggedIn() && (
            <Button type="primary" icon={<PlusOutlined />} className="forum-publish-btn" onClick={() => navigate('/wants/new')}>
              发布求购
            </Button>
          )}
        </div>

        <Card className="forum-filter-card">
          <div className="forum-type-tabs" style={{ marginBottom: 12 }}>
            {CATEGORY_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`forum-type-tab ${filters.category === opt.value ? 'active' : ''}`}
                onClick={() => { setFilters(prev => ({ ...prev, category: opt.value })); setPage(1); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="forum-type-tabs">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`forum-type-tab ${filters.status === opt.value ? 'active' : ''}`}
                onClick={() => { setFilters(prev => ({ ...prev, status: opt.value })); setPage(1); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        <Spin spinning={loading}>
          {(data.items || []).length === 0 ? (
            <Empty description="暂无求购信息" />
          ) : (
            <List
              dataSource={data.items || []}
              renderItem={(want) => (
                <List.Item className="forum-post-item" onClick={() => navigate(`/wants/${want.id}`)}>
                  <div className="forum-post-card" style={{ width: '100%' }}>
                    <div className="forum-post-body">
                      <div className="forum-post-header">
                        <Space size={8} align="center">
                          <Text strong className="forum-post-author">{want.username}</Text>
                          <Tag color="blue">{CATEGORY_LABEL[want.category] || want.category || '未分类'}</Tag>
                          <Tag color={STATUS_COLOR[want.status] || 'default'}>{STATUS_LABEL[want.status] || want.status}</Tag>
                          <Tag color={URGENCY_COLOR[want.urgency] || 'default'}>{want.urgency || '未设置紧急度'}</Tag>
                        </Space>
                      </div>
                      <div className="forum-post-title">{want.title}</div>
                      <Paragraph ellipsis={{ rows: 2 }} className="forum-post-summary">
                        {want.description || '暂无详细描述'}
                      </Paragraph>
                      <Space wrap>
                        <Tag>预算：¥{want.minPrice ?? 0} - ¥{want.maxPrice ?? '不限'}</Tag>
                        {want.keywords && <Tag color="cyan">关键词：{want.keywords}</Tag>}
                        {want.expectedCondition && <Tag color="purple">期望成色：{want.expectedCondition}</Tag>}
                      </Space>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Spin>

        {(data.total || 0) > pageSize && (
          <div className="forum-pagination">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={data.total || 0}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`}
            />
          </div>
        )}
      </div>
    </div>
  );
}