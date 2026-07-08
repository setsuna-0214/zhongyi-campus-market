/**
 * 求购管理（预留页）
 * 求购模块将在阶段四实现，当前显示占位说明与空列表。
 */

import { useEffect, useState, useCallback } from 'react';
import { Table, Empty, message, Tag, Button, Popconfirm, Space } from 'antd';
import { adminCloseWant, adminRestoreWant, listAdminWants } from '../../api/wants';

export default function AdminWants() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminWants({ page, pageSize });
      setData(res || { items: [], total: 0 });
    } catch (e) {
      message.error(e.message || '加载求购列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: '标题', dataIndex: 'title' },
    { title: '发布者', dataIndex: 'username' },
    { title: '分类', dataIndex: 'category', render: (c) => c || '-' },
    { title: '关键词', dataIndex: 'keywords', render: (k) => k || '-' },
    { title: '紧急程度', dataIndex: 'urgency', render: (u) => u ? <Tag color={u === '高' ? 'red' : u === '中' ? 'orange' : 'default'}>{u}</Tag> : '-' },
    { title: '状态', dataIndex: 'status', render: (s) => <Tag color={s === 'OPEN' ? 'blue' : s === 'MATCHED' ? 'green' : 'default'}>{s === 'OPEN' ? '求购中' : s === 'MATCHED' ? '已匹配' : '已关闭'}</Tag> },
    { title: '发布时间', dataIndex: 'createdAt', render: (v) => v ? String(v).replace('T', ' ').substring(0, 19) : '-' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'CLOSED' ? (
            <Popconfirm title="确认恢复该求购？" onConfirm={async () => { try { const r = await adminRestoreWant(record.id); message.success(r?.message || '已恢复'); fetchData(); } catch (e) { message.error(e.message || '操作失败'); } }}>
              <Button size="small" type="primary">恢复</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认关闭该求购？" onConfirm={async () => { try { const r = await adminCloseWant(record.id); message.success(r?.message || '已关闭'); fetchData(); } catch (e) { message.error(e.message || '操作失败'); } }}>
              <Button size="small" danger>关闭</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
        rowKey="id"
        columns={columns}
        dataSource={data.items || []}
        loading={loading}
        locale={{ emptyText: <Empty description="暂无求购数据" /> }}
        pagination={{
          current: page,
          pageSize,
          total: data.total || 0,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
  );
}