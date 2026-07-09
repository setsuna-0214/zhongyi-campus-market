# 后端测试代码报告

## 1. 概述 (Overview)
本报告对位于 `src/test/java/org/example/campusmarket` 的后端测试套件进行了简要总结。测试代码结构清晰，覆盖了控制器层 (Controller)、业务层 (Service) 以及集成测试 (Integration)。

## 2. 测试结构 (Test Structure)
测试代码分为三个主要类别：

### 2.1 控制器层测试 (`Controller/`)
-   **位置**: `Controller/` 目录
-   **关注点**: API 接口验证、HTTP 请求参数校验、响应状态码及响应体检查。
-   **主要技术**: `MockMvc`, `@WebMvcTest`, Service 层模拟 (Mocking)。
-   **包含文件**: `AuthControllerTest`, `ProductControllerTest` 等 8 个测试类。

### 2.2 业务层测试 (`Service/`)
-   **位置**: `Service/` 目录
-   **关注点**: 核心业务逻辑、边界情况、异常处理及 Mapper 调用验证。
-   **主要技术**: JUnit 5, Mockito (`@Mock`, `@InjectMocks`)。
-   **包含文件**: `AuthServiceTest`, `ProductServiceTest` 等 9 个测试类。

### 2.3 集成测试 (`integration/`)
-   **位置**: `integration/` 目录
-   **关注点**: 验证完整的业务流程 (Controller -> Service -> Database/Mock)。
-   **主要技术**: `BaseIntegrationTest` (基础集成类), `MockMvc`。
-   **包含文件**: `AuthIntegrationTest`, `UserIntegrationTest` 等 8 个测试类。

## 3. 功能模块覆盖 (Test Coverage)

| 模块 | 相关测试类 | 描述 |
| :--- | :--- | :--- |
| **认证 (Auth)** | `AuthControllerTest`<br>`AuthServiceTest`<br>`AuthIntegrationTest` | 覆盖登录 (邮箱/用户名)、注册 (验证码校验、密码匹配)、忘记密码流程。 |
| **用户 (User)** | `UserControllerTest`<br>`UserServiceTest`<br>`UserIntegrationTest` | 覆盖用户个人信息管理相关操作。 |
| **商品 (Product)** | `ProductControllerTest`<br>`ProductServiceTest`<br>`ProductIntegrationTest` | 覆盖商品增删改查、热度计算逻辑 (ProductHotness)。 |
| **订单 (Order)** | `OrdersControllerTest`<br>`OrdersServiceTest`<br>`OrderIntegrationTest` | 覆盖订单创建及处理流程。 |
| **购物车 (Cart)** | `CartControllerTest`<br>`CartServiceTest`<br>`CartIntegrationTest` | 覆盖购物车添加、删除等操作。 |
| **主页 (Home)** | `HomeControllerTest`<br>`HomeServiceTest`<br>`HomeIntegrationTest` | 覆盖主页数据聚合展示。 |
| **收藏 (Favorite)** | `FavoriteControllerTest`<br>`FavoriteServiceTest`<br>`FavoriteIntegrationTest` | 覆盖商品收藏功能。 |
| **图片 (Image)** | `ImageServiceTest` | 覆盖图片处理服务逻辑。 |

## 4. 技术栈 (Technology Stack)
-   **测试框架**: JUnit 5, Spring Boot Test
-   **模拟框架**: Mockito (用于模拟依赖)
-   **HTTP 测试**: MockMvc (用于模拟 HTTP 请求)
-   **断言工具**: JUnit Assertions, JSONPath (用于验证 JSON 响应)

## 5. 观察总结 (Key Observations)
-   **结构规范**: 每个主要功能模块 (Auth, User, Product 等) 都有对应的 Controller, Service 和 Integration 测试，结构统一。
-   **验证细致**: 测试用例详细覆盖了输入校验 (如：邮箱为空、密码不一致) 和成功/失败的各种场景。
-   **隔离性好**: Service 层测试通过 Mock 隔离了数据库依赖，专注于业务逻辑验证。
