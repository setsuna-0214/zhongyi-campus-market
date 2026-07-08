/**
 * 商品管理
 * 列表（标题/价格/发布者/分类/状态/发布时间） + 下架/恢复
 */

import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Image } from 'antd';
import { listProducts, offlineProduct, restoreProduct } from '../../api/admin';

export default function AdminProducts() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducts({ page, pageSize });
      setData(res || { items: [], total: 0 });
    } catch (e) {
      message.error(e.message || '加载商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOffline = async (id) => {
    try {
      const res = await offlineProduct(id);
      message.success(res?.message || '已下架');
      fetchData();
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await restoreProduct(id);
      message.success(res?.message || '已恢复');
      fetchData();
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    {
      title: '图片',
      dataIndex: 'picture',
      width: 72,
      render: (url) => (url ? <Image width={48} height={48} src={url} /> : <span style={{ color: '#ccc' }}>无</span>),
    },
    { title: '标题', dataIndex: 'title' },
    { title: '价格', dataIndex: 'price', render: (p) => (p != null ? `¥${p}` : '-') },
    { title: '分类', dataIndex: 'category', render: (c) => c || '-' },
    { title: '发布者', dataIndex: 'sellerName', render: (s) => s || '-' },
    {
      title: '交易状态',
      dataIndex: 'status',
      render: (s) => <Tag color={s === '在售' ? 'green' : 'default'}>{s}</Tag>,
    },
    {
      title: '下架状态',
      dataIndex: 'adminOffline',
      render: (v) => <Tag color={v ? 'red' : 'blue'}>{v ? '已下架' : '正常'}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      render: (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.adminOffline ? (
            <Popconfirm title="确认恢复上架？" onConfirm={() => handleRestore(record.id)}>
              <Button size="small" type="primary">恢复</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认下架该商品？普通用户将不再看到它。" onConfirm={() => handleOffline(record.id)}>
              <Button size="small" danger>下架</Button>
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