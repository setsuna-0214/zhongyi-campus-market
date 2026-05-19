-- ============================================
-- 校园二手交易平台 - 测试数据填充脚本
-- 使用方法: mysql -u root -p campus_market < seed_data.sql
-- 所有测试用户密码: Test123456
-- 注意: 此脚本不会清空现有数据，ID从20开始
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE campus_market;

-- ============================================
-- 1. 用户数据 (20个用户, ID: 20-39)
-- 密码: Test123456 -> BCrypt加密
-- ============================================
INSERT IGNORE INTO `users` (`user_id`, `username`, `email`, `password`, `role`, `status`, `created_at`) VALUES
(20, 'test_zhangsan', 'test_zhangsan@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-01 10:00:00'),
(21, 'test_lisi', 'test_lisi@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-02 11:30:00'),
(22, 'test_wangwu', 'test_wangwu@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-03 14:20:00'),
(23, 'test_zhaoliu', 'test_zhaoliu@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-05 09:15:00'),
(24, 'test_sunqi', 'test_sunqi@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-06 16:45:00'),
(25, 'test_zhouba', 'test_zhouba@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-08 08:30:00'),
(26, 'test_wujiu', 'test_wujiu@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-10 13:00:00'),
(27, 'test_zhengshi', 'test_zhengshi@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-12 17:20:00'),
(28, 'test_qianyi', 'test_qianyi@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-15 10:10:00'),
(29, 'test_haner', 'test_haner@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-09-18 15:30:00'),
(30, 'test_xiaoming', 'test_xiaoming@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-01 09:00:00'),
(31, 'test_xiaohong', 'test_xiaohong@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-05 10:30:00'),
(32, 'test_xiaogang', 'test_xiaogang@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-10 14:00:00'),
(33, 'test_xiaoli', 'test_xiaoli@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-12 11:20:00'),
(34, 'test_xiaowei', 'test_xiaowei@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-15 16:00:00'),
(35, 'test_xiaofang', 'test_xiaofang@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-18 09:45:00'),
(36, 'test_xiaojun', 'test_xiaojun@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-20 13:30:00'),
(37, 'test_xiaoyan', 'test_xiaoyan@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-22 15:15:00'),
(38, 'test_xiaopeng', 'test_xiaopeng@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'user', 1, '2025-08-25 10:00:00'),
(39, 'test_admin', 'test_admin@campus.edu', '$2a$10$TUbdppRRqFIsFV7MQJ9anuRyFHq20Aw4guGuveXTTDzMcynC4bvMS', 'admin', 1, '2025-07-01 08:00:00');

-- ============================================
-- 2. 用户信息表 (学校统一为中山大学)
-- ============================================
INSERT IGNORE INTO `userinfo` (`user_id`, `username`, `email`, `role`, `nickname`, `avatar`, `phone`, `address`, `bio`, `gender`) VALUES
(20, 'test_zhangsan', 'test_zhangsan@campus.edu', 'user', '张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', '13800000001', '中山大学', '大三学生', 1),
(21, 'test_lisi', 'test_lisi@campus.edu', 'user', '李四', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', '13800000002', '中山大学', '计算机专业', 1),
(22, 'test_wangwu', 'test_wangwu@campus.edu', 'user', '王五', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu', '13800000003', '中山大学', NULL, 1),
(23, 'test_zhaoliu', 'test_zhaoliu@campus.edu', 'user', '赵六', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu', '13800000004', '中山大学', '喜欢运动', 0),
(24, 'test_sunqi', 'test_sunqi@campus.edu', 'user', '孙七', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunqi', '13800000005', '中山大学', NULL, 1),
(25, 'test_zhouba', 'test_zhouba@campus.edu', 'user', '周八', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouba', '13800000006', '中山大学', '文学爱好者', 0),
(26, 'test_wujiu', 'test_wujiu@campus.edu', 'user', '吴九', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wujiu', '13800000007', '中山大学', NULL, 1),
(27, 'test_zhengshi', 'test_zhengshi@campus.edu', 'user', '郑十', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengshi', '13800000008', '中山大学', '研究生在读', 1),
(28, 'test_qianyi', 'test_qianyi@campus.edu', 'user', '钱一', 'https://api.dicebear.com/7.x/avataaars/svg?seed=qianyi', '13800000009', '中山大学', NULL, 0),
(29, 'test_haner', 'test_haner@campus.edu', 'user', '韩二', 'https://api.dicebear.com/7.x/avataaars/svg?seed=haner', '13800000010', '中山大学', '大四学生', 1),
(30, 'test_xiaoming', 'test_xiaoming@campus.edu', 'user', '小明同学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', '13900000011', '中山大学', '数码爱好者', 1),
(31, 'test_xiaohong', 'test_xiaohong@campus.edu', 'user', '小红', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', '13900000012', '中山大学', '喜欢读书', 0),
(32, 'test_xiaogang', 'test_xiaogang@campus.edu', 'user', '小刚', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaogang', '13900000013', '中山大学', '生活达人', 1),
(33, 'test_xiaoli', 'test_xiaoli@campus.edu', 'user', '小丽', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoli', '13900000014', '中山大学', '闲置物品转让', 0),
(34, 'test_xiaowei', 'test_xiaowei@campus.edu', 'user', '小伟', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaowei', '13900000015', '中山大学', '电子产品发烧友', 1),
(35, 'test_xiaofang', 'test_xiaofang@campus.edu', 'user', '小芳', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaofang', '13900000016', '中山大学', '生活用品转让', 0),
(36, 'test_xiaojun', 'test_xiaojun@campus.edu', 'user', '小军', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaojun', '13900000017', '中山大学', '考研资料分享', 1),
(37, 'test_xiaoyan', 'test_xiaoyan@campus.edu', 'user', '小燕', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyan', '13900000018', '中山大学', '兴趣广泛', 0),
(38, 'test_xiaopeng', 'test_xiaopeng@campus.edu', 'user', '小鹏', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaopeng', '13900000019', '中山大学', '游戏玩家', 1),
(39, 'test_admin', 'test_admin@campus.edu', 'admin', '测试管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', '13900000020', '中山大学', '平台管理员', 1);


-- ============================================
-- 3. 商品数据 (30个商品, ID: 20-49)
-- 分类: electronics, books, daily, other
-- ============================================
INSERT IGNORE INTO `products` (`pro_id`, `pro_name`, `price`, `is_seal`, `discription`, `picture`, `saler_id`, `category`, `view_count`, `created_at`) VALUES
-- 数码电子类 electronics
(20, 'MacBook Pro 2022 M2芯片', 8500.00, 0, '自用一年，成色95新，无磕碰，电池循环次数低，送原装充电器', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 30, 'electronics', 328, '2025-10-01 10:00:00'),
(21, 'iPhone 14 Pro 256G 暗紫色', 5200.00, 1, '换机出售，全原装无拆修，Face ID正常，电池健康89%', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 30, 'electronics', 456, '2025-10-05 14:30:00'),
(22, 'AirPods Pro 2代', 980.00, 0, '买了半年，降噪效果很好，配件齐全', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400', 30, 'electronics', 189, '2025-10-10 09:15:00'),
(23, '机械键盘Cherry红轴', 380.00, 0, '打字手感好，RGB灯效，87键', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400', 34, 'electronics', 267, '2025-10-02 10:30:00'),
(24, '罗技G502游戏鼠标', 220.00, 1, '经典款，配重可调，送鼠标垫', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 34, 'electronics', 345, '2025-10-05 14:00:00'),
(25, '显示器支架双臂', 150.00, 0, '解放桌面空间，承重15kg', 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400', 34, 'electronics', 123, '2025-10-10 09:00:00'),
(26, '移动硬盘1TB西数', 280.00, 0, 'USB3.0高速传输，存资料必备', 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400', 34, 'electronics', 189, '2025-10-15 11:30:00'),
(27, 'PS5光驱版国行', 3200.00, 0, '买了吃灰，送两个游戏光盘', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400', 38, 'electronics', 456, '2025-09-20 10:00:00'),
(28, 'Switch OLED白色', 1800.00, 1, '续航增强版，送保护壳和塞尔达', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400', 38, 'electronics', 389, '2025-09-25 14:00:00'),
(29, 'Xbox手柄无线版', 280.00, 0, '兼容PC，蓝牙连接，电池续航长', 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=400', 38, 'electronics', 234, '2025-10-05 16:30:00'),
-- 图书教材类 books
(30, '高等数学同济第七版上下册', 35.00, 0, '考研用书，有少量笔记，不影响阅读', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 31, 'books', 267, '2025-09-20 11:00:00'),
(31, '计算机网络谢希仁第八版', 28.00, 1, '期末考试必备，重点已标注', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400', 31, 'books', 198, '2025-09-22 15:45:00'),
(32, '数据结构C语言版严蔚敏', 25.00, 0, '经典教材，保存完好', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', 31, 'books', 156, '2025-09-25 10:30:00'),
(33, '考研英语真题黄皮书2025', 45.00, 0, '全新未拆封，买多了一本', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400', 31, 'books', 312, '2025-10-01 08:00:00'),
(34, '王道计算机考研全套2025', 180.00, 0, '数据结构+操作系统+计网+组成原理', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400', 36, 'books', 423, '2025-09-01 08:00:00'),
(35, '张宇考研数学全套', 150.00, 0, '基础30讲+强化+真题，有视频课笔记', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400', 36, 'books', 387, '2025-09-05 10:00:00'),
(36, '肖秀荣政治全套2025', 95.00, 1, '精讲精练+1000题+肖四肖八', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400', 36, 'books', 298, '2025-09-10 14:30:00'),
-- 生活用品类 daily
(37, '小米台灯护眼灯', 89.00, 0, '考研期间用的，亮度可调', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 35, 'daily', 134, '2025-09-10 15:00:00'),
(38, '收纳箱大号三件套', 55.00, 0, '搬宿舍用，容量大，可折叠', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 35, 'daily', 98, '2025-09-12 11:20:00'),
(39, '电热水壶1.8L', 45.00, 0, '用了一年，功能正常，烧水快', 'https://images.unsplash.com/photo-1594213114663-d94db9b17440?w=400', 35, 'daily', 112, '2025-09-20 16:45:00'),
(40, '床上书桌折叠桌', 68.00, 1, '宿舍神器，可调节高度', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400', 32, 'daily', 178, '2025-09-15 10:00:00'),
(41, '落地风扇静音款', 120.00, 0, '三档风速，遥控操作', 'https://images.unsplash.com/photo-1617375407633-acd67aba7864?w=400', 32, 'daily', 145, '2025-09-18 14:30:00'),
(42, '衣架晾衣架套装50个', 35.00, 0, '不锈钢材质，结实耐用', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 32, 'daily', 87, '2025-09-22 09:00:00'),
-- 其他物品类 other
(43, 'Nike Air Zoom跑鞋 42码', 350.00, 0, '穿了几次，尺码不合适，9成新', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 33, 'other', 234, '2025-09-15 16:00:00'),
(44, '羽毛球拍尤尼克斯双拍套装', 280.00, 1, '送球和手胶，适合入门', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 33, 'other', 178, '2025-09-18 14:20:00'),
(45, '瑜伽垫加厚防滑', 65.00, 0, '全新，买来没用过，送收纳袋', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', 33, 'other', 145, '2025-09-28 11:30:00'),
(46, '雅马哈尤克里里23寸', 320.00, 0, '入门神器，音色清亮，送教程', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400', 37, 'other', 176, '2025-09-25 15:00:00'),
(47, '电子琴61键带教学功能', 450.00, 0, '适合初学者，自带节拍器', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400', 37, 'other', 134, '2025-10-01 11:00:00'),
(48, '优衣库羽绒服女M码', 299.00, 0, '去年买的，穿了几次，保暖性好', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 33, 'other', 287, '2025-10-12 10:00:00'),
(49, '篮球斯伯丁室外耐磨', 120.00, 0, '用了一个学期，手感还不错', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400', 37, 'other', 203, '2025-10-08 17:00:00');

-- ============================================
-- 4. 订单数据 (15个订单, ID: 20-34)
-- ============================================
INSERT IGNORE INTO `orders` (`id`, `user_id`, `product_id`, `quantity`, `total_price`, `status`, `seller_id`, `created_at`, `rating`, `comment`) VALUES
(20, 32, 21, 1, 5200.00, 'completed', 30, '2025-10-06 10:00:00', 5, '手机成色很新，卖家很nice'),
(21, 33, 24, 1, 220.00, 'completed', 34, '2025-10-06 15:00:00', 5, '鼠标手感很好，物超所值'),
(22, 30, 28, 1, 1800.00, 'completed', 38, '2025-09-26 11:00:00', 4, '游戏机不错，就是有点小划痕'),
(23, 34, 31, 1, 28.00, 'completed', 31, '2025-09-23 16:00:00', 5, '书保存得很好，笔记也有用'),
(24, 35, 36, 1, 95.00, 'completed', 36, '2025-09-11 09:00:00', 5, '政治资料很全，感谢学长'),
(25, 31, 40, 1, 68.00, 'completed', 32, '2025-09-16 14:00:00', 4, '折叠桌很实用'),
(26, 36, 44, 1, 280.00, 'completed', 33, '2025-09-19 10:00:00', 5, '球拍质量很好，打球很舒服'),
(27, 37, 21, 1, 5200.00, 'completed', 30, '2025-10-08 09:00:00', NULL, NULL),
(28, 31, 20, 1, 8500.00, 'pending', 30, '2025-11-01 10:00:00', NULL, NULL),
(29, 32, 34, 1, 180.00, 'pending', 36, '2025-11-02 14:00:00', NULL, NULL),
(30, 38, 37, 1, 89.00, 'pending', 35, '2025-11-03 09:00:00', NULL, NULL),
(31, 30, 46, 1, 320.00, 'pending', 37, '2025-11-04 16:00:00', NULL, NULL),
(32, 33, 27, 1, 3200.00, 'pending_buyer', 38, '2025-10-25 11:00:00', NULL, NULL),
(33, 35, 23, 1, 380.00, 'pending_buyer', 34, '2025-10-28 15:00:00', NULL, NULL),
(34, 34, 30, 1, 35.00, 'cancelled', 31, '2025-10-20 10:00:00', NULL, NULL);

-- ============================================
-- 5. 收藏数据 (10条)
-- ============================================
INSERT IGNORE INTO `fav_products` (`id`, `user_id`, `pro_id`, `created_at`) VALUES
(20, 31, 20, '2025-10-02 10:00:00'),
(21, 32, 22, '2025-10-11 14:00:00'),
(22, 33, 27, '2025-09-21 09:00:00'),
(23, 34, 30, '2025-09-21 11:00:00'),
(24, 35, 34, '2025-09-02 16:00:00'),
(25, 36, 43, '2025-09-16 10:00:00'),
(26, 37, 47, '2025-10-02 15:00:00'),
(27, 38, 20, '2025-10-03 09:00:00'),
(28, 30, 35, '2025-09-06 14:00:00'),
(29, 31, 46, '2025-09-26 11:00:00');

-- ============================================
-- 6. 商品评论数据 (20条)
-- ============================================
INSERT IGNORE INTO `comments` (`id`, `product_id`, `user_id`, `content`, `created_at`) VALUES
(20, 20, 31, '这个价格很划算，请问还能再便宜点吗？', '2025-10-02 10:30:00'),
(21, 20, 32, '成色看起来不错，电池循环多少次了？', '2025-10-02 14:00:00'),
(22, 22, 33, 'AirPods降噪效果怎么样？', '2025-10-11 09:00:00'),
(23, 27, 34, 'PS5还在吗？可以当面验货吗？', '2025-09-21 10:00:00'),
(24, 27, 35, '送的游戏是什么？', '2025-09-22 15:00:00'),
(25, 30, 36, '书上笔记多吗？影响阅读吗？', '2025-09-21 11:30:00'),
(26, 34, 37, '王道全套包括哪些书？', '2025-09-02 09:00:00'),
(27, 34, 38, '有配套视频吗？', '2025-09-03 14:00:00'),
(28, 35, 30, '张宇的书难度怎么样？', '2025-09-06 10:00:00'),
(29, 37, 31, '台灯是什么色温的？', '2025-09-11 16:00:00'),
(30, 43, 32, '跑鞋是正品吗？有购买凭证吗？', '2025-09-16 11:00:00'),
(31, 43, 36, '42码偏大还是偏小？', '2025-09-17 09:00:00'),
(32, 46, 33, '尤克里里适合零基础吗？', '2025-09-26 10:00:00'),
(33, 46, 38, '送的教程是视频还是书？', '2025-09-27 14:00:00'),
(34, 47, 30, '电子琴重吗？方便搬运吗？', '2025-10-02 16:00:00'),
(35, 48, 31, '羽绒服是什么填充物？', '2025-10-13 10:00:00'),
(36, 23, 37, '键盘是有线还是无线的？', '2025-10-03 11:00:00'),
(37, 25, 33, '支架能装多大的显示器？', '2025-10-11 15:00:00'),
(38, 29, 34, '手柄连接稳定吗？', '2025-10-06 09:00:00'),
(39, 41, 35, '风扇噪音大吗？', '2025-09-19 10:00:00');

