import { useMemo, useState, useLayoutEffect } from 'react';
import './index.css';

/**
 * SubTabSlider - 带滑块指示器的水平标签切换组件
 * 
 * @param {Object} props
 * @param {Array} props.tabs - 标签项数组 [{ key, label, icon? }]
 * @param {string} props.activeKey - 当前选中的标签 key
 * @param {function} props.onChange - 选中标签时的回调函数
 * @param {string} props.className - 自定义类名，用于区分不同用途的标签组
 */
const SubTabSlider = ({ 
  tabs = [], 
  activeKey, 
  onChange,
  className = ''
}) => {
  // 初始加载状态，用于禁用首次渲染时的动画
  const [isInitialized, setIsInitialized] = useState(false);

  // 计算当前选中项的索引
  const selectedIndex = useMemo(() => {
    const index = tabs.findIndex(tab => tab.key === activeKey);
    return index >= 0 ? index : 0;
  }, [tabs, activeKey]);

  // 计算滑块的 translateX 值（百分比）
  const sliderPosition = useMemo(() => {
    return getHorizontalSliderPosition(selectedIndex, tabs.length);
  }, [selectedIndex, tabs.length]);

  // 计算滑块宽度（百分比）
  const sliderWidth = useMemo(() => {
    if (tabs.length === 0) return '0%';
    return `${100 / tabs.length}%`;
  }, [tabs.length]);

  // 初始加载后启用动画
  useLayoutEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsInitialized(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleTabClick = (key) => {
    if (onChange) {
      onChange(key);
    }
  };

  return (
    <div className={`sub-tab-slider ${className}`.trim()}>
      {/* 滑块指示器 */}
      <div 
        className={`sub-tab-indicator ${isInitialized ? 'animated' : 'no-animation'}`}
        style={{ 
          transform: `translateX(${sliderPosition})`,
          width: sliderWidth
        }}
      />
      
      {/* 标签项列表 */}
      <div className="sub-tab-items">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`sub-tab-item ${activeKey === tab.key ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.icon && <span className="sub-tab-icon">{tab.icon}</span>}
            <span className="sub-tab-label">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 计算水平滑块位置
 * @param {number} selectedIndex - 选中项索引
 * @param {number} tabCount - 标签总数
 * @returns {string} - CSS translateX 值（百分比）
 */
export const getHorizontalSliderPosition = (selectedIndex, tabCount) => {
  if (tabCount === 0) return '0%';
  return `${selectedIndex * 100}%`;
};

export default SubTabSlider;
