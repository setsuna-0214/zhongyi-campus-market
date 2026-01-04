/**
 * 订单标签行组件
 * 包含订单类型（购买/出售）和订单状态（待处理/已完成/已取消）两组标签
 */

import SubTabSlider from '../SubTabSlider';
import './index.css';

const OrderTabRow = ({
  orderType = 'purchase',
  orderStatus = 'pending',
  onTypeChange,
  onStatusChange
}) => {
  // 订单类型标签配置
  const orderTypeTabs = [
    { key: 'purchase', label: '购买订单' },
    { key: 'sell', label: '出售订单' }
  ];

  // 订单状态标签配置
  const orderStatusTabs = [
    { key: 'pending', label: '待处理' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' }
  ];

  return (
    <div className="order-tab-row">
      {/* 左侧：订单类型标签 */}
      <div className="order-tab-group order-type-group">
        <SubTabSlider
          tabs={orderTypeTabs}
          activeKey={orderType}
          onChange={onTypeChange}
          className="order-type-slider"
        />
      </div>

      {/* 右侧：订单状态标签 */}
      <div className="order-tab-group order-status-group">
        <SubTabSlider
          tabs={orderStatusTabs}
          activeKey={orderStatus}
          onChange={onStatusChange}
          className="status-tab-slider"
        />
      </div>
    </div>
  );
};

export default OrderTabRow;
