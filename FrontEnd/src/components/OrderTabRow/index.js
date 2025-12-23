import SubTabSlider from '../SubTabSlider';
import './index.css';

/**
 * OrderTabRow - 订单处理页面的标签行组件
 * 包含订单类型（购买订单/出售订单）和订单状态（待处理/已完成/已取消）两组标签
 * 
 * @param {Object} props
 * @param {string} props.orderType - 当前选中的订单类型 ('purchase' | 'sell')
 * @param {string} props.orderStatus - 当前选中的订单状态 ('pending' | 'completed' | 'cancelled')
 * @param {function} props.onTypeChange - 订单类型变化时的回调函数
 * @param {function} props.onStatusChange - 订单状态变化时的回调函数
 */
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
