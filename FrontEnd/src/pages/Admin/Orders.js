/**
 * 订单管理
 * 列表（买家/卖家/商品/状态/创建时间）
 */

import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, message } from 'antd';
import { listOrders } from '../../api/admin';

/** 订单状态英文到中文映射（沿用后端 Order.status 字面量） */
const ORDER_STATUS_CN = {
  pending: '待处理',
  seller_processed: '卖家已处理',
  completed: '已完成',
  cancelled: '已取消',
};
const ORDER_STATUS_COLOR = {
  pending: 'orange',
  seller_processed: 'blue',
  completed: 'green',
  cancelled: 'default',
};

export default function AdminOrders() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders({ page, pageSize });
      setData(res || { items: [], total: 0 });
    } catch (e) {
      message.error(e.message || '加载订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { title: '订单ID', dataIndex: 'id', width: 80 },
    { title: '买家', dataIndex: 'buyerName', render: (v, r) => v || `用户${r.buyerId || ''}` },
    { title: '卖家', dataIndex: 'sellerName', render: (v, r) => v || (r.sellerId ? `用户${r.sellerId}` : '-') },
    { title: '商品', dataIndex: 'productTitle', render: (v) => v || '-' },
    { title: '总价', dataIndex: 'totalPrice', render: (p) => (p != null ? `¥${p}` : '-') },
    {
      title: '订单状态',
      dataIndex: 'status',
      render: (s) => (
        <Tag color={ORDER_STATUS_COLOR[s] || 'default'}>
          {ORDER_STATUS_CN[s] || s || '-'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-'),
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