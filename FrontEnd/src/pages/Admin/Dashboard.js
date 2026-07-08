/**
 * 管理员统计首页
 * 展示用户/商品/订单/帖子/求购/今日新增等汇总卡片
 */

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, message } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  ProfileOutlined,
  MessageOutlined,
  BulbOutlined,
  FlagOutlined,
  RiseOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { getStatistics } from '../../api/admin';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stat, setStat] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getStatistics();
        if (mounted) setStat(data);
      } catch (e) {
        message.error(e.message || '加载统计数据失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  const items = [
    { title: '用户总数', value: stat?.userCount ?? 0, icon: <UserOutlined />, color: '#4FACFE' },
    { title: '商品总数', value: stat?.productCount ?? 0, icon: <ShoppingOutlined />, color: '#5B8CFF' },
    { title: '订单总数', value: stat?.orderCount ?? 0, icon: <ProfileOutlined />, color: '#FF8F5E' },
    { title: '论坛帖子数', value: stat?.forumPostCount ?? 0, icon: <MessageOutlined />, color: '#A0E7E5' },
    { title: '求购信息数', value: stat?.wantCount ?? 0, icon: <BulbOutlined />, color: '#9B7BFF' },
    { title: '待处理举报', value: stat?.pendingReportCount ?? 0, icon: <FlagOutlined />, color: '#FF6B6B', suffix: '（暂未启用）' },
    { title: '今日新增商品', value: stat?.todayNewProducts ?? 0, icon: <PlusOutlined />, color: '#67C23A' },
    { title: '今日新增帖子', value: stat?.todayNewPosts ?? 0, icon: <RiseOutlined />, color: '#E6A23C' },
  ];

  return (
    <Row gutter={[16, 16]}>
      {items.map((it) => (
        <Col xs={12} sm={12} md={8} lg={6} key={it.title}>
          <Card hoverable>
            <Statistic
              title={it.title}
              value={it.value}
              prefix={it.icon}
              valueStyle={{ color: it.color }}
              suffix={it.suffix}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}