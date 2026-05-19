/**
 * 我的帖子 - 个人中心子页面
 * 显示用户发布的帖子列表（标题、分类、发布时间）
 * 点击列表项跳转帖子详情
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Tag, Empty, Button, Spin, Typography, Space } from 'antd';
import { ClockCircleOutlined, MessageOutlined, LikeOutlined, EyeOutlined } from '@ant-design/icons';
import { getPostsByUser } from '../../../api/forum';

const { Text } = Typography;

const POST_TYPE_CONFIG = {
  normal: { color: 'blue', label: '普通帖' },
  resource: { color: 'green', label: '资源帖' },
  help: { color: 'orange', label: '求助帖' },
};

export default function SectionMyPosts({ userId }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    getPostsByUser(userId, { page, pageSize })
      .then(result => {
        if (!cancelled) {
          setPosts(result?.posts || []);
          setTotal(result?.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Card
      title={
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          我的帖子
          {total > 0 && (
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
              （共 {total} 篇）
            </Text>
          )}
        </span>
      }
      extra={
        <Button type="primary" size="small" onClick={() => navigate('/publish-post')}>
          发新帖
        </Button>
      }
      className="section-card"
    >
      <Spin spinning={loading}>
        {posts.length === 0 && !loading ? (
          <Empty description="还没有发布过帖子">
            <Button type="primary" onClick={() => navigate('/publish-post')}>去发帖</Button>
          </Empty>
        ) : (
          <List
            dataSource={posts}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
              showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`,
            }}
            renderItem={(post) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '14px 0', transition: 'background 0.2s' }}
                onClick={() => navigate(`/forum/posts/${post.id}`)}
                className="my-posts-list-item"
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <Tag
                      color={POST_TYPE_CONFIG[post.postType]?.color || 'default'}
                      style={{ flexShrink: 0, fontSize: 11 }}
                    >
                      {POST_TYPE_CONFIG[post.postType]?.label || post.postType}
                    </Tag>
                    <Text strong style={{ fontSize: 15, lineHeight: '1.4', flex: 1 }}>
                      {post.title}
                    </Text>
                  </div>
                  <Space size={16} style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    <span><ClockCircleOutlined style={{ marginRight: 4 }} />{formatTime(post.createdAt)}</span>
                    <span><LikeOutlined style={{ marginRight: 3 }} />{post.likeCount || 0}</span>
                    <span><MessageOutlined style={{ marginRight: 3 }} />{post.commentCount || 0}</span>
                    <span><EyeOutlined style={{ marginRight: 3 }} />{post.viewCount || 0}</span>
                  </Space>
                </div>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  );
}
