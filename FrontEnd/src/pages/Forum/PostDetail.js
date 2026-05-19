/**
 * 帖子详情页
 * 帖子内容 + 点赞/收藏/分享互动区 + 评论区（楼中楼）+ 悬浮回复框
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar, Tag, Button, Spin, Empty, message,
  Typography, Tooltip, Modal, Input
} from 'antd';
import {
  LikeOutlined, LikeFilled, StarOutlined, StarFilled,
  ShareAltOutlined, MessageOutlined, EyeOutlined,
  LeftOutlined, SmileOutlined, PictureOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  getPostDetail, getComments, createComment, createReply,
  deleteComment, togglePostLike, toggleCommentLike,
  addForumFavorite, removeForumFavorite
} from '../../api/forum';
import { isLoggedIn } from '../../utils/auth';
import './Forum.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const POST_TYPE_CONFIG = {
  normal: { color: 'blue', label: '普通帖' },
  resource: { color: 'green', label: '资源帖' },
  help: { color: 'orange', label: '求助帖' },
};

const COMMENT_SORT_OPTIONS = [
  { label: '时间正序', value: 'asc' },
  { label: '时间倒序', value: 'desc' },
  { label: '热度排序', value: 'hot' },
];

const EMOJI_LIST = ['😀','😂','🥰','😎','🤔','😭','👍','🎉','💪','🔥','❤️','✨'];

export default function PostDetail() {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [commentSort, setCommentSort] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  // 悬浮回复框状态
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);

  // 楼中楼内联回复框
  const [activeReplyId, setActiveReplyId] = useState(null); // 正在回复的 commentId
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);

  // 图片预览
  const [previewImg, setPreviewImg] = useState(null);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPostDetail(postId);
      if (data) setPost(data);
    } catch (e) {
      message.error('加载帖子失败');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async (page = 1, sort = commentSort) => {
    setCommentLoading(true);
    try {
      const data = await getComments(postId, { sort, page, pageSize: 10 });
      if (page === 1) {
        setComments(data?.comments || []);
      } else {
        setComments(prev => [...prev, ...(data?.comments || [])]);
      }
      setCommentTotal(data?.total || 0);
    } catch (e) {
      // ignore
    } finally {
      setCommentLoading(false);
    }
  }, [postId, commentSort]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => { fetchComments(1); }, [postId, commentSort]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 切换帖子点赞
  const handlePostLike = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      const result = await togglePostLike(postId);
      setPost(prev => ({ ...prev, liked: result.liked, likeCount: result.likeCount }));
    } catch { message.error('操作失败'); }
  };

  // 切换收藏
  const handleFavorite = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      if (post.favorited) {
        await removeForumFavorite(postId);
        setPost(prev => ({ ...prev, favorited: false }));
        message.success('已取消收藏');
      } else {
        await addForumFavorite(postId);
        setPost(prev => ({ ...prev, favorited: true }));
        message.success('收藏成功');
      }
    } catch { message.error('操作失败'); }
  };

  // 切换评论点赞
  const handleCommentLike = async (comment) => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      const result = await toggleCommentLike(comment.id);
      setComments(prev => prev.map(c =>
        c.id === comment.id ? { ...c, liked: result.liked, likeCount: result.likeCount } : c
      ));
    } catch { message.error('操作失败'); }
  };

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      message.success('评论已删除');
    } catch { message.error('删除失败'); }
  };

  // 发表顶层评论（悬浮框）
  const handleSubmitComment = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!replyText.trim()) { message.warning('请输入内容'); return; }
    setSubmitting(true);
    try {
      await createComment({ postId: Number(postId), content: replyText, images: replyImages });
      setReplyText('');
      setReplyImages([]);
      setShowEmoji(false);
      message.success('评论成功');
      // 刷新评论
      fetchComments(1);
    } catch { message.error('评论失败'); }
    finally { setSubmitting(false); }
  };

  // 发表楼中楼回复
  const handleSubmitReply = async (comment) => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!inlineReplyText.trim()) { message.warning('请输入内容'); return; }
    setInlineSubmitting(true);
    try {
      await createReply({
        postId: Number(postId),
        parentId: comment.id,
        rootId: comment.id,
        replyToUserId: comment.userId,
        content: inlineReplyText,
      });
      setInlineReplyText('');
      setActiveReplyId(null);
      message.success('回复成功');
      fetchComments(1);
    } catch { message.error('回复失败'); }
    finally { setInlineSubmitting(false); }
  };

  // Emoji 插入
  const handleEmojiClick = (emoji) => {
    setReplyText(prev => prev + emoji);
  };

  // 图片上传（悬浮框）
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(f => URL.createObjectURL(f));
    setReplyImages(prev => [...prev, ...urls].slice(0, 4));
    e.target.value = '';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-container">
          <Empty description="帖子不存在或已被删除">
            <Button onClick={() => navigate('/forum')}>返回论坛</Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 12, color: 'var(--text-secondary)' }}
        >
          返回
        </Button>

        {/* 帖子主体 */}
        <div className="post-detail-card">
          {/* 作者信息 */}
          <div className="post-detail-author">
            <Avatar
              size={48}
              src={post.userAvatar}
              style={{ cursor: 'pointer', flexShrink: 0 }}
              onClick={() => navigate(`/users/${post.userId}`)}
            >
              {(post.userNickname || '?')[0]}
            </Avatar>
            <div className="post-detail-author-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ fontSize: 15 }}>{post.userNickname}</Text>
                <Tag color={POST_TYPE_CONFIG[post.postType]?.color || 'default'}>
                  {POST_TYPE_CONFIG[post.postType]?.label || post.postType}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(post.createdAt)}</Text>
            </div>
          </div>

          {/* 标题 */}
          <Title level={3} className="post-detail-title">{post.title}</Title>

          {/* 正文 */}
          <div className="post-detail-content">{post.content}</div>

          {/* 图片 */}
          {post.images && post.images.length > 0 && (
            <div className="post-detail-images">
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className="post-detail-img"
                  onClick={() => setPreviewImg(img)}
                />
              ))}
            </div>
          )}

          {/* 互动操作区 */}
          <div className="post-actions-bar">
            <button
              className={`post-action-btn ${post.liked ? 'liked' : ''}`}
              onClick={handlePostLike}
            >
              {post.liked ? <LikeFilled /> : <LikeOutlined />}
              <span>{post.likeCount || 0} 点赞</span>
            </button>
            <button
              className={`post-action-btn ${post.favorited ? 'favorited' : ''}`}
              onClick={handleFavorite}
            >
              {post.favorited ? <StarFilled /> : <StarOutlined />}
              <span>收藏</span>
            </button>
            <button
              className="post-action-btn"
              onClick={() => { navigator.clipboard?.writeText(window.location.href); message.success('链接已复制'); }}
            >
              <ShareAltOutlined />
              <span>分享</span>
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13, marginLeft: 'auto' }}>
              <EyeOutlined /> {post.viewCount || 0} 浏览
            </span>
          </div>
        </div>

        {/* 评论区 */}
        <div className="comment-section">
          <div className="comment-section-title">
            <MessageOutlined />
            评论区
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>（{commentTotal} 条）</Text>
          </div>

          {/* 排序 */}
          <div className="comment-sort-bar">
            {COMMENT_SORT_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                size="small"
                type={commentSort === opt.value ? 'primary' : 'default'}
                style={{ borderRadius: 12, fontSize: 12 }}
                onClick={() => { setCommentSort(opt.value); setCommentPage(1); }}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* 评论列表 */}
          <Spin spinning={commentLoading}>
            {comments.length === 0 && !commentLoading ? (
              <Empty description="还没有评论，来说第一句话吧！" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <Avatar
                    size={38}
                    src={comment.userAvatar}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => navigate(`/users/${comment.userId}`)}
                  >
                    {(comment.userNickname || '?')[0]}
                  </Avatar>
                  <div className="comment-body">
                    <div className="comment-header">
                      <Text strong style={{ fontSize: 13 }}>{comment.userNickname}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{formatTime(comment.createdAt)}</Text>
                    </div>
                    <div className="comment-content">{comment.content}</div>

                    {/* 评论图片 */}
                    {comment.images && comment.images.length > 0 && (
                      <div className="comment-images">
                        {comment.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" className="comment-img" onClick={() => setPreviewImg(img)} />
                        ))}
                      </div>
                    )}

                    {/* 评论操作 */}
                    <div className="comment-actions">
                      <button
                        className={`comment-action-btn ${comment.liked ? 'liked' : ''}`}
                        onClick={() => handleCommentLike(comment)}
                      >
                        {comment.liked ? <LikeFilled /> : <LikeOutlined />}
                        <span>{comment.likeCount || 0}</span>
                      </button>
                      <button
                        className="comment-action-btn"
                        onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
                      >
                        <MessageOutlined />
                        <span>回复</span>
                      </button>
                      {/* 楼中楼子评论数 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {comment.replies.length} 条回复
                        </span>
                      )}
                    </div>

                    {/* 楼中楼 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="nested-replies">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="reply-item">
                            <Avatar size={26} src={reply.userAvatar} style={{ flexShrink: 0 }}>
                              {(reply.userNickname || '?')[0]}
                            </Avatar>
                            <div className="reply-body">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <Text strong style={{ fontSize: 12 }}>{reply.userNickname}</Text>
                                {reply.replyToUserNickname && (
                                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    → <span className="reply-to">{reply.replyToUserNickname}</span>
                                  </span>
                                )}
                                <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>{formatTime(reply.createdAt)}</Text>
                              </div>
                              <div className="reply-content">{reply.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 内联回复框 */}
                    {activeReplyId === comment.id && (
                      <div className="inline-reply-box">
                        <TextArea
                          autoFocus
                          placeholder={`回复 ${comment.userNickname}...`}
                          autoSize={{ minRows: 2, maxRows: 4 }}
                          value={inlineReplyText}
                          onChange={e => setInlineReplyText(e.target.value)}
                          maxLength={500}
                          style={{ border: 'none', padding: 0, resize: 'none', fontSize: 13 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                          <Button size="small" onClick={() => { setActiveReplyId(null); setInlineReplyText(''); }}>取消</Button>
                          <Button
                            size="small" type="primary"
                            loading={inlineSubmitting}
                            disabled={!inlineReplyText.trim()}
                            onClick={() => handleSubmitReply(comment)}
                          >
                            回复
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* 加载更多 */}
            {comments.length < commentTotal && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button
                  type="text"
                  onClick={() => {
                    const nextPage = commentPage + 1;
                    setCommentPage(nextPage);
                    fetchComments(nextPage);
                  }}
                >
                  加载更多评论
                </Button>
              </div>
            )}
          </Spin>
        </div>
      </div>

      {/* 悬浮回复框 */}
      <div className="floating-reply-bar">
        <div className="floating-reply-inner">
          <div className="floating-reply-actions">
            <Tooltip
              title={
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 200 }}>
                  {EMOJI_LIST.map(e => (
                    <span
                      key={e}
                      style={{ cursor: 'pointer', fontSize: 20 }}
                      onClick={() => handleEmojiClick(e)}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              }
              trigger="click"
              open={showEmoji}
              onOpenChange={setShowEmoji}
              placement="topLeft"
            >
              <button className="reply-action-icon-btn" title="表情">
                <SmileOutlined />
              </button>
            </Tooltip>
            <button
              className="reply-action-icon-btn"
              title="图片"
              onClick={() => fileInputRef.current?.click()}
            >
              <PictureOutlined />
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>

          <div style={{ flex: 1 }}>
            {/* 图片预览 */}
            {replyImages.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                {replyImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={img} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                    <button
                      onClick={() => setReplyImages(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: -4, right: -4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <TextArea
              placeholder="写下你的评论..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              maxLength={500}
              style={{ resize: 'none', borderRadius: 12 }}
            />
          </div>

          <Button
            type="primary"
            loading={submitting}
            disabled={!replyText.trim()}
            onClick={handleSubmitComment}
            style={{ borderRadius: 16, padding: '0 20px', height: 38 }}
          >
            发布
          </Button>
        </div>
      </div>

      {/* 图片预览弹窗 */}
      <Modal
        open={!!previewImg}
        footer={null}
        onCancel={() => setPreviewImg(null)}
        centered
        width="auto"
        styles={{ body: { padding: 0 } }}
      >
        {previewImg && (
          <img src={previewImg} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block', borderRadius: 8 }} />
        )}
      </Modal>
    </div>
  );
}
