/**
 * 系统状态面板
 * 展示后端/数据库/Redis 状态、当前环境、服务器时间及各业务计数
 */

import { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Spin, message, Descriptions, Timeline } from 'antd';
import { getSystemStatus } from '../../api/admin';

/** 根据状态文本生成颜色 */
function statusColor(s) {
  if (s === '正常') return 'green';
  if (s === '异常') return 'red';
  return 'default';
}

export default function AdminSystem() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getSystemStatus();
        if (mounted) setStatus(data);
      } catch (e) {
        message.error(e.message || '加载系统状态失败');
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

  if (!status) {
    return <div>暂无系统状态数据</div>;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="依赖探活">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="后端">
              <Tag color={statusColor(status.backend)}>{status.backend || '未知'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="数据库">
              <Tag color={statusColor(status.database)}>{status.database || '未知'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Redis">
              <Tag color={statusColor(status.redis)}>{status.redis || '未知'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="运行环境">
              {status.profile || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="服务器时间">
              {status.serverTime || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="业务计数">
          <Timeline
            items={[
              { children: `用户数量：${status.userCount ?? 0}`, color: 'blue' },
              { children: `商品数量：${status.productCount ?? 0}`, color: 'cyan' },
              { children: `订单数量：${status.orderCount ?? 0}`, color: 'orange' },
              { children: `帖子数量：${status.forumPostCount ?? 0}`, color: 'green' },
              { children: `求购数量：${status.wantCount ?? 0}`, color: 'purple' },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}