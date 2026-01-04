/**
 * 滑块菜单组件
 * 带滑块指示器的垂直菜单
 */

import { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import './index.css';

const SliderMenu = ({
  items = [],
  selectedKey,
  onSelect,
  itemHeight = 44,
  itemGap = 8
}) => {
  // 初始加载状态，用于禁用首次渲染时的动画
  const [isInitialized, setIsInitialized] = useState(false);

  // 计算当前选中项的索引
  const selectedIndex = useMemo(() => {
    const index = items.findIndex(item => item.key === selectedKey);
    return index >= 0 ? index : 0;
  }, [items, selectedKey]);

  // 计算滑块的 translateY 值
  const sliderPosition = useMemo(() => {
    return selectedIndex * (itemHeight + itemGap);
  }, [selectedIndex, itemHeight, itemGap]);

  // 初始加载后启用动画
  useLayoutEffect(() => {
    // 使用 requestAnimationFrame 确保首次渲染完成后再启用动画
    const timer = requestAnimationFrame(() => {
      setIsInitialized(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleItemClick = (key) => {
    if (onSelect) {
      onSelect(key);
    }
  };

  return (
    <div className="slider-menu">
      {/* 滑块指示器 */}
      <div
        className={`slider-indicator ${isInitialized ? 'animated' : 'no-animation'}`}
        style={{
          transform: `translateY(${sliderPosition}px)`,
          height: `${itemHeight}px`
        }}
      />

      {/* 菜单项列表 */}
      <div className="slider-menu-items" style={{ gap: `${itemGap}px` }}>
        {items.map((item) => (
          <div
            key={item.key}
            className={`slider-menu-item ${selectedKey === item.key ? 'active' : ''}`}
            onClick={() => handleItemClick(item.key)}
            style={{ height: `${itemHeight}px` }}
          >
            {item.icon && <span className="slider-menu-icon">{item.icon}</span>}
            <span className="slider-menu-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 导出滑块位置计算函数，供测试使用
export const getVerticalSliderPosition = (selectedIndex, itemHeight, itemGap) => {
  return selectedIndex * (itemHeight + itemGap);
};

export default SliderMenu;
