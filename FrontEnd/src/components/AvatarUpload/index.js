/**
 * 头像上传组件
 * 支持图片选择、裁剪、上传，覆盖主流图片格式
 */

import { useState, useRef, useCallback } from 'react';
import {
  Modal,
  Button,
  Upload,
  Avatar,
  message,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  UndoOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { uploadAvatar } from '../../api/user';
import { resolveAvatar } from '../../utils/images';
import { message as antdMessage } from 'antd';
import './index.css';

// 支持的头像图片格式 - 覆盖主流图片格式
const ACCEPTED_AVATAR_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/tiff',
];
const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 头像上传组件
 * @param {Object} props
 * @param {boolean} props.visible - 弹窗是否可见
 * @param {Function} props.onClose - 关闭弹窗回调
 * @param {string} props.currentAvatar - 当前头像URL
 * @param {Function} props.onSuccess - 上传成功回调，参数为新头像URL
 */
const AvatarUpload = ({ visible, onClose, currentAvatar, onSuccess }) => {
  // 头像裁剪相关状态
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // 验证头像文件格式和大小
  const validateAvatarFile = (file) => {
    // 检查 MIME 类型
    if (!ACCEPTED_AVATAR_FORMATS.includes(file.type)) {
      antdMessage.error(`不支持的图片格式: ${file.type || '未知格式'}，请上传 JPG、PNG、WebP、GIF 等格式`);
      return false;
    }
    // 检查文件大小
    if (file.size > MAX_AVATAR_SIZE) {
      antdMessage.error(`图片过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请选择 10MB 以内的图片`);
      return false;
    }
    return true;
  };

  // 选择图片后进入裁剪模式
  const handleAvatarSelect = (file) => {
    // 先验证文件
    if (!validateAvatarFile(file)) {
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCrop(undefined);
      setCompletedCrop(null);
    };
    reader.readAsDataURL(file);
    return false;
  };

  // 图片加载完成后设置初始裁剪区域
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height, 280);
    const newCrop = centerCrop(
      makeAspectCrop({ unit: 'px', width: cropSize }, 1, width, height),
      width,
      height
    );
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  }, []);

  // 生成裁剪后的图片
  const getCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return null;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 图片显示尺寸到原始尺寸的比例
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio || 1;
    const outputSize = 200;

    canvas.width = outputSize * pixelRatio;
    canvas.height = outputSize * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // 裁剪框在原始图片上的位置
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop]);

  // 确认上传裁剪后的头像
  const handleConfirmAvatar = async () => {
    try {
      const croppedBlob = await getCroppedImage();
      if (!croppedBlob) {
        message.error('裁剪失败，请重试');
        return;
      }

      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const resp = await uploadAvatar(file);
      const newAvatar = resp?.avatarUrl;
      if (newAvatar) {
        onSuccess?.(newAvatar);
      }
      message.success('头像更新成功！');
      handleClose();
    } catch {
      message.error('头像上传失败');
    }
  };

  // 关闭弹窗并重置状态
  const handleClose = () => {
    setCropImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    onClose?.();
  };

  // 重置裁剪（重新选择图片）
  const handleResetCrop = () => {
    setCropImageSrc(null);
  };

  return (
    <Modal
      title="更换头像"
      open={visible}
      onCancel={handleClose}
      footer={null}
      centered
      width={cropImageSrc ? 800 : 520}
      maskClosable={false}
      destroyOnHidden
      wrapClassName={`avatar-upload-modal-wrap${cropImageSrc ? ' crop-mode' : ''}`}
    >
      <div className="avatar-upload-content">
        {cropImageSrc ? (
          /* 裁剪模式 */
          <div className="avatar-crop-container">
            <div className="crop-area">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                keepSelection
                ruleOfThirds={false}
                renderSelectionAddon={() => null}
                style={{ background: 'transparent' }}
                minWidth={80}
                minHeight={80}
              >
                <img
                  ref={imgRef}
                  src={cropImageSrc}
                  alt="裁剪预览"
                  style={{ maxHeight: '520px' }}
                  onLoad={onImageLoad}
                  draggable={false}
                />
              </ReactCrop>
            </div>

            <div className="crop-actions">
              <Button
                icon={<UndoOutlined />}
                onClick={handleResetCrop}
                className="reset-btn"
              >
                重新选择
              </Button>
              <Button
                type="primary"
                onClick={handleConfirmAvatar}
                className="confirm-btn"
              >
                确认上传
              </Button>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        ) : (
          /* 选择图片模式 */
          <>
            <div className="avatar-preview">
              <Avatar size={100} src={resolveAvatar(currentAvatar)} icon={<UserOutlined />} />
            </div>
            <Upload name="avatar" showUploadList={false} beforeUpload={handleAvatarSelect} accept={ACCEPTED_AVATAR_FORMATS.join(',')}>
              <Button type="primary" icon={<CameraOutlined />} size="large" className="avatar-upload-btn">
                选择图片
              </Button>
            </Upload>
            <div className="avatar-upload-tip">
              <PictureOutlined className="tip-icon" />
              <span>支持 JPG、PNG、WebP、GIF、HEIC 等格式（10MB 以内），上传后可裁剪调整</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AvatarUpload;
