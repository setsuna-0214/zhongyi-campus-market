/**
 * 用户管理
 * 列表（用户名/邮箱/角色/状态/注册时间） + 禁用/启用
 */

import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm } from 'antd';
import { listUsers, setUserStatus } from '../../api/admin';

export default function AdminUsers() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, pageSize });
      setData(res || { items: [], total: 0 });
    } catch (e) {
      message.error(e.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleStatus = async (record) => {
    const next = record.status === 1 ? 0 : 1;
    try {
      const res = await setUserStatus(record.id, next);
      message.success(res?.message || '操作成功');
      fetchData();
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'default'}>
          {status === 1 ? '正常' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      render: (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      render: (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={record.status === 1 ? '确认禁用该用户？' : '确认启用该用户？'}
            onConfirm={() => toggleStatus(record)}
          >
            <Button
              size="small"
              danger={record.status === 1}
              type={record.status === 1 ? 'default' : 'primary'}
            >
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
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