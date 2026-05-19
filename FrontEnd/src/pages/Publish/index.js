/**
 * 统一发布页
 * 顶部切换器在「发布商品」与「发布帖子」之间切换
 * 商品发布内容来自 Products/Publish.js
 * 帖子发布内容来自 Forum/PublishPost.js
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import SubTabSlider from '../../components/SubTabSlider';
import ProductPublish from '../Products/Publish';
import PostPublish from '../Forum/PublishPost';
import './index.css';

const TABS = [
  { key: 'product', label: '🛒 发布商品' },
  { key: 'post',    label: '💬 发布帖子' },
];

export default function UnifiedPublish() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 从 URL query 中读取初始 tab（?tab=product | ?tab=post）
  const initialTab = searchParams.get('tab') === 'post' ? 'post' : 'product';
  const [activeTab, setActiveTab] = useState(initialTab);

  // 同步 URL 参数
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key }, { replace: true });
  };

  // 外部 tab 参数变化时同步（如 navigate 跳转携带参数）
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'post' || tab === 'product') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="unified-publish-page">
      {/* 顶部切换器 */}
      <div className="unified-publish-switcher">
        <SubTabSlider
          tabs={TABS}
          activeKey={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* 内容区：渲染对应子页面，通过 key 强制重新挂载避免表单串台 */}
      <div className="unified-publish-body">
        {activeTab === 'product' ? (
          <ProductPublish key="product-form" unified />
        ) : (
          <PostPublish key="post-form" unified />
        )}
      </div>
    </div>
  );
}
