import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Empty, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SubTabSlider from '../../../components/SubTabSlider';
import FollowButton from '../../../components/FollowButton';
import { getFollowers, followUser, unfollowUser } from '../../../api/user';

const followTabs = [
  { key: 'following', label: '我的关注' },
  { key: 'followers', label: '关注我的' },
];

export default function SectionFollows({ 
  follows, 
  onUnfollow,
  followSubTab = 'following',
  onSubTabChange
}) {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followBackMap, setFollowBackMap] = useState({});

  // 加载粉丝列表
  useEffect(() => {
    if (followSubTab === 'followers') {
      loadFollowers();
    }
  }, [followSubTab]);

  const loadFollowers = async () => {
    setFollowersLoading(true);
    try {
      const data = await getFollowers();
      setFollowers(data || []);
      // 检查是否已回关
      const followBackStatus = {};
      (data || []).forEach(follower => {
        followBackStatus[follower.id] = follows.some(f => f.id === follower.id);
      });
      setFollowBackMap(followBackStatus);
    } catch (err) {
      console.error('获取粉丝列表失败:', err);
    } finally {
      setFollowersLoading(false);
    }
  };

  // 回关用户
  const handleFollowBack = async (userId) => {
    try {
      await followUser(userId);
      setFollowBackMap(prev => ({ ...prev, [userId]: true }));
      message.success('关注成功');
    } catch (err) {
      console.error('关注失败:', err);
      message.error('关注失败');
    }
  };

  // 取消关注（我的关注列表）
  const handleUnfollow = async (userId) => {
    try {
      await onUnfollow(userId);
    } catch (err) {
      // 错误已在父组件处理
    }
  };

  // 取消回关（粉丝列表中已回关的用户）
  const handleUnfollowBack = async (userId) => {
    try {
      await unfollowUser(userId);
      setFollowBackMap(prev => ({ ...prev, [userId]: false }));
      message.success('已取消关注');
    } catch (err) {
      console.error('取消关注失败:', err);
      message.error('取消关注失败');
    }
  };

  const currentList = followSubTab === 'following' ? follows : followers;
  const isLoading = followSubTab === 'followers' && followersLoading;

  return (
    <Card className="section-card section-follows-card" title={null}>
      {/* 子标签切换 */}
      <div className="section-follows-header">
        <SubTabSlider
          tabs={followTabs}
          activeKey={followSubTab}
          onChange={onSubTabChange}
        />
        <span className="follows-count">
          {followSubTab === 'following' 
            ? `${follows.length} 人` 
            : `${followers.length} 人`
          }
        </span>
      </div>

      {/* 列表内容 */}
      <div className="section-follows-content">
        {currentList && currentList.length > 0 ? (
          <List
            loading={isLoading}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
            dataSource={currentList}
            renderItem={(item) => (
              <List.Item className="follow-grid-item">
                <div className="follow-card" onClick={() => navigate(`/users/${item.id}`)}>
                  <div className="follow-card-content">
                    <Avatar 
                      src={item.avatar} 
                      icon={<UserOutlined />} 
                      size={56} 
                      className="follow-avatar"
                    />
                    <div className="follow-card-info">
                      <div className="follow-user-header">
                        <span className="follow-nickname">
                          {item.nickname || item.username || '未知用户'}
                        </span>
                        {item.username && item.nickname && (
                          <span className="follow-username">@{item.username}</span>
                        )}
                      </div>
                      <div className="follow-bio">
                        {item.bio || '这个用户很懒，什么都没写'}
                      </div>
                    </div>
                  </div>
                  <div className="follow-card-footer">
                    <div className="follow-stats">
                      <span className="follow-stat-item">
                        <span className="follow-stat-value">{item.followersCount ?? 0}</span>
                        <span className="follow-stat-label">粉丝</span>
                      </span>
                      <span className="follow-stat-divider" />
                      <span className="follow-stat-item">
                        <span className="follow-stat-value">{item.followingCount ?? 0}</span>
                        <span className="follow-stat-label">关注</span>
                      </span>
                    </div>
                    <FollowButton
                      isFollowing={followSubTab === 'following' ? true : followBackMap[item.id]}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (followSubTab === 'following') {
                          handleUnfollow(item.id);
                        } else if (followBackMap[item.id]) {
                          handleUnfollowBack(item.id);
                        } else {
                          handleFollowBack(item.id);
                        }
                      }}
                    />
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            description={followSubTab === 'following' ? '还没有关注任何人' : '还没有人关注你'} 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        )}
      </div>
    </Card>
  );
}
