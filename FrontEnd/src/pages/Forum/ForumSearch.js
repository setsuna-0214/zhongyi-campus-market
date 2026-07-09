/**
 * 论坛搜索页
 * 在论坛内搜索帖子（独立搜索系统）
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Space, Spin, Empty, List, Avatar, Tag, Typography, Pagination } from 'antd';
import { SearchOutlined, LikeOutlined, MessageOutlined, EyeOutlined } from '@ant-design/icons';
import { getPosts } from '../../api/forum';
import './Forum.css';

const { Text, Paragraph } = Typography;

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
const CATEGORY_LABEL = {
  '闲置交流': '交易交流',
  '校园拼单': '交易交流',
  '避坑经验': '经验反馈',
  '交易反馈': '经验反馈',
};

function getCategoryLabel(category) {
  return CATEGORY_LABEL[category] || category;
}

export default function ForumSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialKeyword = params.get('q') || '';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [inputVal, setInputVal] = useState(initialKeyword);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!keyword) { setPosts([]); setTotal(0); return; }
    let cancelled = false;
    setLoading(true);
    getPosts({ keyword, page, pageSize, sort: 'latest' })
      .then(result => {
        if (!cancelled) {
          setPosts(result?.posts || []);
          setTotal(result?.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [keyword, page]);

  const handleSearch = () => {
    setKeyword(inputVal.trim());
    setPage(1);
    // 更新 URL 参数
    const p = new URLSearchParams();
    if (inputVal.trim()) p.set('q', inputVal.trim());
    navigate(`/forum/search?${p.toString()}`, { replace: true });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="forum-search-page">
      <div className="forum-search-container">
        {/* 搜索框 */}
        <div style={{ marginBottom: 24 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="large"
              placeholder="搜索论坛帖子..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              autoFocus
            />
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Space.Compact>
        </div>

        {keyword && (
          <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
            搜索 "{keyword}" 共找到 {total} 条结果
          </Text>
        )}

        <Spin spinning={loading}>
          {!keyword ? (
            <Empty description="请输入搜索内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : posts.length === 0 && !loading ? (
            <Empty description={`未找到关于 "${keyword}" 的帖子`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <List
                dataSource={posts}
                renderItem={post => (
                  <List.Item
                    style={{ padding: '0 0 12px', border: 'none', cursor: 'pointer' }}
                    onClick={() => navigate(`/forum/posts/${post.id}`)}
                  >
                    <div className="forum-post-card" style={{ width: '100%' }}>
                      <Avatar size={40} src={post.userAvatar}>{(post.userNickname || '?')[0]}</Avatar>
                      <div className="forum-post-body">
                        <div className="forum-post-header">
                          <Space size={6}>
                            <Text strong style={{ fontSize: 13 }}>{post.userNickname}</Text>
                            {post.category && <Tag color={CATEGORY_COLOR[post.category] || 'default'}>{getCategoryLabel(post.category)}</Tag>}
                            <Text type="secondary" style={{ fontSize: 11 }}>{formatTime(post.createdAt)}</Text>
                          </Space>
                        </div>
                        <div className="forum-post-title">{post.title}</div>
                        {post.summary && (
                          <Paragraph ellipsis={{ rows: 1 }} className="forum-post-summary">{post.summary}</Paragraph>
                        )}
                        <div className="forum-post-stats">
                          <span className="forum-stat-btn"><LikeOutlined /><span>{post.likeCount || 0}</span></span>
                          <span className="forum-stat-btn"><MessageOutlined /><span>{post.commentCount || 0}</span></span>
                          <span className="forum-stat-btn"><EyeOutlined /><span>{post.viewCount || 0}</span></span>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
              {total > pageSize && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={setPage}
                    showSizeChanger={false}
                    showTotal={(t, r) => `第 ${r[0]}-${r[1]} 条`}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </div>
    </div>
  );
}
