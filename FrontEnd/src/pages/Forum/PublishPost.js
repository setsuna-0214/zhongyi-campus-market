/**
 * 帖子发布页（独立文件）
 * 可选择帖子类型（普通/资源/求助），支持标题、内容、图片上传
 * 样式参考商品发布页，使用 SubTabSlider 切换类型
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, message, Typography, Alert, Modal, Select, Spin
} from 'antd';
import {
  CheckCircleOutlined, EyeOutlined, DeleteOutlined,
  CloudUploadOutlined, LeftOutlined, RightOutlined, CloseOutlined
} from '@ant-design/icons';
import SubTabSlider from '../../components/SubTabSlider';
import { createPost, updatePost, getPostDetail } from '../../api/forum';
import './Forum.css';
import '../../styles/form.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const POST_TYPE_TABS = [
  { key: 'normal', label: '普通帖' },
  { key: 'resource', label: '资源帖' },
  { key: 'help', label: '求助帖' },
];

const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 9;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function PublishPost({ unified = false }) {
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const isEditMode = !!postId;

  const [form] = Form.useForm();
  const [postType, setPostType] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 编辑模式：加载帖子数据
  const loadPostData = useCallback(async () => {
    if (!postId) return;
    setInitialLoading(true);
    try {
      const post = await getPostDetail(postId);
      form.setFieldsValue({
        title: post.title,
        content: post.content,
      });
      setPostType(post.postType || 'normal');
      if (post.images && post.images.length > 0) {
        setImageList(post.images.map((url, i) => ({
          uid: `existing-${i}`,
          name: `image-${i}.jpg`,
          status: 'done',
          url,
          isExisting: true,
        })));
      }
    } catch {
      message.error('加载帖子信息失败');
      navigate('/forum');
    } finally {
      setInitialLoading(false);
    }
  }, [postId, form, navigate]);

  useEffect(() => { if (isEditMode) loadPostData(); }, [isEditMode, loadPostData]);

  // 文件校验
  const validateFile = useCallback((file) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      message.error(`不支持的格式: ${file.name}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      message.error(`文件过大: ${file.name}`);
      return false;
    }
    return true;
  }, []);

  // 处理文件
  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const remaining = MAX_IMAGES - imageList.length;
    const toAdd = fileArray.slice(0, remaining).filter(validateFile);
    const newImgs = toAdd.map((file, i) => ({
      uid: `upload-${Date.now()}-${i}`,
      name: file.name,
      status: 'done',
      originFileObj: file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));
    const updated = [...imageList, ...newImgs];
    setImageList(updated);
  }, [imageList, validateFile]);

  // 组件卸载清理 Object URL
  useEffect(() => {
    return () => {
      imageList.forEach(img => {
        if (img.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 拖拽
  const handleDragEnter = e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = e => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = e => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files);
  };

  // 删除图片
  const handleDelete = useCallback((uid) => {
    setImageList(prev => {
      const img = prev.find(i => i.uid === uid);
      if (img?.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.uid !== uid);
    });
  }, []);

  // 预览导航
  const handlePrev = () => setPreviewIndex(p => (p > 0 ? p - 1 : imageList.length - 1));
  const handleNext = () => setPreviewIndex(p => (p < imageList.length - 1 ? p + 1 : 0));

  // 键盘导航
  useEffect(() => {
    if (!previewVisible) return;
    const handler = e => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setPreviewVisible(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewVisible, imageList.length]);

  // 提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 图片：已有的 URL + 新上传的（此处为简化：仅支持已有 URL；实际可先上传再提交）
      const images = imageList.map(img => img.url || img.preview).filter(Boolean);
      const payload = {
        title: values.title,
        content: values.content,
        postType,
        images,
      };
      if (isEditMode) {
        await updatePost(postId, payload);
        message.success('帖子更新成功！');
        navigate(`/forum/posts/${postId}`);
      } else {
        const result = await createPost(payload);
        message.success('帖子发布成功！');
        navigate(`/forum/posts/${result.id || ''}`);
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className={unified ? '' : 'publish-post-page'}>
    <div className="publish-post-container">
      {/* 仅在独立路由模式显示标题 */}
      {!unified && (
        <div className="publish-post-header">
          <Title level={2}>{isEditMode ? '编辑帖子' : '发布帖子'}</Title>
          <Text type="secondary">{isEditMode ? '修改后点击保存' : '分享你的想法，或寻求帮助'}</Text>
        </div>
      )}

      <Card className="publish-post-card">
        {/* 帖子类型选择 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>帖子类型</div>
          <SubTabSlider
            tabs={POST_TYPE_TABS}
            activeKey={postType}
            onChange={setPostType}
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={({ errorFields }) => {
            message.error(errorFields[0]?.errors[0] || '请填写完整信息');
          }}
          className="publish-form form-input-style"
          scrollToFirstError
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label={<span className="form-label-decorated">帖子标题</span>}
            rules={[
              { required: true, message: '请输入帖子标题' },
              { min: 2, message: '标题至少 2 个字符' },
              { max: 100, message: '标题不能超过 100 个字符' },
            ]}
          >
            <Input placeholder="请输入帖子标题（2-100 个字符）" showCount maxLength={100} />
          </Form.Item>

          <Form.Item
            name="content"
            label={<span className="form-label-decorated">帖子内容</span>}
            rules={[
              { required: true, message: '请输入帖子内容' },
              { min: 5, message: '内容至少 5 个字符' },
              { max: 10000, message: '内容不能超过 10000 个字符' },
            ]}
          >
            <TextArea
              placeholder="说点什么..."
              showCount
              maxLength={10000}
              autoSize={{ minRows: 8, maxRows: 20 }}
            />
          </Form.Item>

          {/* 图片上传 */}
          <Form.Item label={<span className="form-label-decorated">配图（可选）</span>}>
            <div className="custom-image-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FORMATS.join(',')}
                multiple
                onChange={e => { if (e.target.files.length) handleFileSelect(e.target.files); e.target.value = ''; }}
                style={{ display: 'none' }}
              />
              <div className="image-upload-list">
                {imageList.map((img, idx) => (
                  <div key={img.uid} className="image-upload-item">
                    <img
                      src={img.url || img.preview}
                      alt={img.name}
                      className="image-upload-thumbnail"
                    />
                    {idx === 0 && <span className="image-cover-badge">封面</span>}
                    <div className="image-upload-actions">
                      <button type="button" className="image-action-btn" onClick={() => { setPreviewIndex(idx); setPreviewVisible(true); }} title="预览">
                        <EyeOutlined />
                      </button>
                      <button type="button" className="image-action-btn" onClick={() => handleDelete(img.uid)} title="删除">
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                ))}
                {imageList.length < MAX_IMAGES && (
                  <div
                    className={`image-upload-trigger ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <CloudUploadOutlined className="upload-icon" />
                    <span className="upload-text">上传图片</span>
                    <span className="upload-count">{imageList.length}/{MAX_IMAGES}</span>
                  </div>
                )}
              </div>
            </div>
            <Text type="secondary">最多 9 张，支持 JPG/PNG/WebP/GIF（10MB 以内）</Text>
          </Form.Item>

          <Alert
            message="发帖须知"
            description="请确保内容真实友善，禁止发布违法违规内容，维护良好的论坛环境。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="step-actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              {isEditMode ? '保存修改' : '确认发布'}
            </Button>
            <Button style={{ marginLeft: 12 }} onClick={() => navigate(-1)}>取消</Button>
          </div>
        </Form>
      </Card>

      {/* 图片预览弹窗 */}
      <Modal
        open={previewVisible}
        title={null}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        className="image-preview-modal"
        width="auto"
        closable={false}
      >
        <button type="button" className="preview-close-btn" onClick={() => setPreviewVisible(false)} aria-label="关闭预览">
          <CloseOutlined />
        </button>
        <div className="preview-content">
          {imageList.length > 1 && (
            <button type="button" className="preview-nav-btn preview-prev" onClick={handlePrev}><LeftOutlined /></button>
          )}
          <img alt="preview" className="preview-image" src={imageList[previewIndex]?.url || imageList[previewIndex]?.preview} />
          {imageList.length > 1 && (
            <button type="button" className="preview-nav-btn preview-next" onClick={handleNext}><RightOutlined /></button>
          )}
          {imageList.length > 1 && (
            <div className="preview-indicator">{previewIndex + 1} / {imageList.length}</div>
          )}
        </div>
      </Modal>
    </div>
    </div>
  );
}
