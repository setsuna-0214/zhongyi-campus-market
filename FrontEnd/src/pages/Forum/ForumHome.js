/**
 * 论坛首页
 * 帖子列表 + 类型筛选 + 排序
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Avatar, Tag, Button, Space, Spin, Empty,
  Pagination, Typography, Divider, Tooltip
} from 'antd';
import {
  LikeOutlined, LikeFilled, MessageOutlined, EyeOutlined,
  ShareAltOutlined, PlusOutlined, FireOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { getPosts, togglePostLike } from '../../api/forum';
import { isLoggedIn } from '../../utils/auth';
import './Forum.css';

const { Title, Text, Paragraph } = Typography;

// 论坛只保留一层分类，旧分类在展示和筛选时归并到这几个入口。
const CATEGORY_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '交易交流', value: '交易交流' },
  { label: '求购互助', value: '求购互助' },
  { label: '经验反馈', value: '经验反馈' },
  { label: '失物招领', value: '失物招领' },
];
const CATEGORY_COLOR = {
  '交易交流': 'blue',
  '闲置交流': 'blue',
  '校园拼单': 'blue',
  '求购互助': 'orange',
  '经验反馈': 'green',
  '避坑经验': 'green',
  '交易反馈': 'green',
  '失物招领': 'purple',
};

const SORT_OPTIONS = [
  { label: '最新发布', value: 'latest', icon: <ClockCircleOutlined /> },
  { label: '最热', value: 'hot', icon: <FireOutlined /> },
];

const CATEGORY_LABEL = {
  '闲置交流': '交易交流',
  '校园拼单': '交易交流',
  '避坑经验': '经验反馈',
  '交易反馈': '经验反馈',
};

function getCategoryLabel(category) {
  return CATEGORY_LABEL[category] || category;
}

export default function ForumHome() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ category: 'all', sort: 'latest' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPosts({
        category: filters.category,
        sort: filters.sort,
        page,
        pageSize,
      });
      setPosts(result?.posts || []);
      setTotal(result?.total || 0);
    } catch (e) {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      const result = await togglePostLike(post.id);
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, liked: result.liked, likeCount: result.likeCount }
          : p
      ));
    } catch { /* ignore */ }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`;
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="forum-page">
      <div className="forum-container">
        {/* 顶部标题区 */}
        <div className="forum-hero">
          <Title level={2} className="forum-title">中易论坛</Title>
          <Text className="forum-subtitle">交流 · 分享 · 互助</Text>
          {isLoggedIn() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="forum-publish-btn"
              onClick={() => navigate('/publish?tab=post')}
            >
              发帖
            </Button>
          )}
        </div>

        {/* 筛选栏 */}
        <Card className="forum-filter-card">
          <div className="forum-filter-bar">
            <div className="forum-type-tabs">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`forum-type-tab ${filters.category === opt.value ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 排序 */}
            <Space>
              {SORT_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  type={filters.sort === opt.value ? 'primary' : 'default'}
                  icon={opt.icon}
                  size="small"
                  onClick={() => handleFilterChange('sort', opt.value)}
                  className="forum-sort-btn"
                >
                  {opt.label}
                </Button>
              ))}
            </Space>
          </div>
        </Card>

        {/* 帖子列表 */}
        <div className="forum-list-wrapper">
          <Spin spinning={loading}>
            {posts.length === 0 && !loading ? (
              <Empty description="暂无帖子，来发一篇吧！" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                {isLoggedIn() && (
                  <Button type="primary" onClick={() => navigate('/publish?tab=post')}>去发帖</Button>
                )}
              </Empty>
            ) : (
              <List
                dataSource={posts}
                renderItem={(post) => (
                  <List.Item className="forum-post-item" onClick={() => navigate(`/forum/posts/${post.id}`)}>
                    <div className="forum-post-card">
                      {/* 左侧：头像 */}
                      <Avatar
                        size={44}
                        src={post.userAvatar}
                        className="forum-post-avatar"
                        onClick={e => { e.stopPropagation(); navigate(`/users/${post.userId}`); }}
                      >
                        {(post.userNickname || '?')[0]}
                      </Avatar>

                      {/* 右侧：内容 */}
                      <div className="forum-post-body">
                        <div className="forum-post-header">
                          <Space size={8} align="center">
                            <Text strong className="forum-post-author">{post.userNickname}</Text>
                            {post.category && (
                              <Tag color={CATEGORY_COLOR[post.category] || 'default'}>
                                {getCategoryLabel(post.category)}
                              </Tag>
                            )}
                            <Text type="secondary" className="forum-post-time">{formatTime(post.createdAt)}</Text>
                          </Space>
                        </div>

                        <div className="forum-post-title">{post.title}</div>

                        {post.summary && (
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            className="forum-post-summary"
                          >
                            {post.summary}
                          </Paragraph>
                        )}

                        {/* 图片预览 */}
                        {post.images && post.images.length > 0 && (
                          <div className="forum-post-images">
                            {post.images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt=""
                                className="forum-post-thumb"
                                onClick={e => e.stopPropagation()}
                              />
                            ))}
                            {post.images.length > 3 && (
                              <div className="forum-post-more-imgs">+{post.images.length - 3}</div>
                            )}
                          </div>
                        )}

                        {/* 互动数据 */}
                        <div className="forum-post-stats">
                          <Tooltip title={post.liked ? '取消点赞' : '点赞'}>
                            <button
                              className={`forum-stat-btn ${post.liked ? 'liked' : ''}`}
                              onClick={(e) => handleLike(e, post)}
                            >
                              {post.liked ? <LikeFilled /> : <LikeOutlined />}
                              <span>{post.likeCount || 0}</span>
                            </button>
                          </Tooltip>
                          <button className="forum-stat-btn">
                            <MessageOutlined />
                            <span>{post.commentCount || 0}</span>
                          </button>
                          <button className="forum-stat-btn">
                            <EyeOutlined />
                            <span>{post.viewCount || 0}</span>
                          </button>
                          <button className="forum-stat-btn">
                            <ShareAltOutlined />
                            <span>{post.shareCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </div>

        {/* 分页 */}
        {total > pageSize && (
          <div className="forum-pagination">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
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
