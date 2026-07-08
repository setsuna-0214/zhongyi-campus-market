/**
 * 论坛管理
 * 列表（标题/作者/类型/浏览/点赞/评论/隐藏状态/发布时间） + 隐藏/恢复
 */

import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm } from 'antd';
import { listForumPosts, hideForumPost, restoreForumPost } from '../../api/admin';

/** 帖子类型英文到中文映射 */
const POST_TYPE_CN = {
  normal: '普通帖',
  resource: '资源帖',
  help: '求助帖',
};
const CATEGORY_COLOR = {
  '闲置交流': 'blue',
  '求购互助': 'orange',
  '避坑经验': 'red',
  '校园拼单': 'green',
  '失物招领': 'purple',
  '交易反馈': 'cyan',
};

export default function AdminPosts() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listForumPosts({ page, pageSize });
      setData(res || { items: [], total: 0 });
    } catch (e) {
      message.error(e.message || '加载帖子列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleHide = async (id) => {
    try {
      const res = await hideForumPost(id);
      message.success(res?.message || '已隐藏');
      fetchData();
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await restoreForumPost(id);
      message.success(res?.message || '已恢复');
      fetchData();
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title' },
    {
      title: '类型',
      dataIndex: 'postType',
      render: (t) => <Tag color="blue">{POST_TYPE_CN[t] || t || '-'}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      render: (c) => c ? <Tag color={CATEGORY_COLOR[c] || 'default'}>{c}</Tag> : <Tag>未分类</Tag>,
    },
    { title: '作者', dataIndex: 'userNickname', render: (v, r) => v || `用户${r.userId || ''}` },
    { title: '浏览', dataIndex: 'viewCount', width: 80 },
    { title: '点赞', dataIndex: 'likeCount', width: 80 },
    { title: '评论', dataIndex: 'commentCount', width: 80 },
    {
      title: '状态',
      dataIndex: 'hidden',
      render: (h) => <Tag color={h ? 'red' : 'green'}>{h ? '已隐藏' : '正常'}</Tag>,
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
          {record.hidden ? (
            <Popconfirm title="确认恢复该帖子？" onConfirm={() => handleRestore(record.id)}>
              <Button size="small" type="primary">恢复</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认隐藏该帖子？普通用户将不再看到它。" onConfirm={() => handleHide(record.id)}>
              <Button size="small" danger>隐藏</Button>
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