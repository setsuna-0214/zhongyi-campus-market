import React from 'react';
import { Card, List, Avatar, Button, Empty, Popconfirm } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function SectionFollows({ follows, onUnfollow }) {
  const navigate = useNavigate();

  return (
    <Card className="section-card" title={`我的关注 (${follows.length})`}>
      {follows && follows.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={follows}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="确定要取消关注吗？"
                  onConfirm={() => onUnfollow(item.id)}
                  okText="是"
                  cancelText="否"
                >
                  <Button type="link" danger>取消关注</Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={item.avatar} 
                    icon={<UserOutlined />} 
                    size={48} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${item.id}`)}
                  />
                }
                title={
                  <a onClick={() => navigate(`/users/${item.id}`)}>{item.nickname || item.username || '未知用户'}</a>
                }
                description={item.bio || '这个用户很懒，什么都没写'}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="还没有关注任何人" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
}
