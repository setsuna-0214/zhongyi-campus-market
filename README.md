# zhongyi-campus-market
中级实训项目 校园二手交易平台 - 中易

项目开发日志：https://lcnm6c2kbobk.feishu.cn/wiki/Q0fswcKsViN5D4kDAK6c17n3n5g?from=from_copylink


# 提交规范

## 提交信息格式
提交信息需带有类型前缀，格式如下：
| 类型前缀    | 说明                                                         | 示例                                            |
| -------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| **`feat`**     | **新功能（feature）**：提交引入了一个新的功能。              | `feat: 添加用户登录功能`                        |
| **`fix`**      | **修复bug（bug fix）**：提交修复了一个代码中的错误或问题。   | `fix: 修复首页图片无法加载的问题`               |
| **`docs`**     | **文档（documentation）**：仅包含文档的更新，如README、CHANGELOG或其他说明文件的修改。 | `docs: 更新API接口文档`                         |
| **`style`**    | **代码格式（style）**：不影响代码含义的更改，如空格、格式化、缺少分号等（**注意：不是指CSS样式**）。 | `style: 按照ESLint规则格式化代码`               |
| **`refactor`** | **代码重构（refactor）**：既不是修复bug也不是添加新功能的代码更改，即优化代码结构、重命名变量等，但不改变其外部行为。 | `refactor: 重构用户模块以提高可读性`            |
| **`perf`**     | **性能优化（performance）**：提高性能的代码更改。            | `perf: 优化图片懒加载算法减少内存占用`          |
| **`test`**     | **测试（test）**：添加缺失的测试或更正现有的测试。           | `test: 为用户登录功能添加单元测试`              |
| **`chore`**    | **杂务（chore）**：其他不修改源代码或测试文件的更改，例如构建过程、依赖管理、工具配置（webpack、gitignore等）的变动。 | `chore: 更新webpack配置` `chore: 升级axios依赖` |
| **`build`**    | **构建系统（build）**：影响构建系统或外部依赖的更改（例如：gulp, broccoli, npm）。通常与`chore`类似，但更专注于构建。 | `build: 更新CI流水线配置`                       |
| **`ci`**       | **持续集成（continuous integration）**：更改CI配置文件和脚本（例如：Travis, Circle, GitHub Actions）。 | `ci: 在GitHub Actions中增加Node.js版本`         |
| **`revert`**   | **回滚（revert）**：回滚先前的某个提交。                     | `revert: 回滚某次提交：修复登录逻辑错误`        |

## 提交方式
请不要直接在本仓库`main`分支上进行开发。本仓库的`main`分支仅允许合并Pull Request。你可以采取以下两种方式之一进行开发。

### 分支开发
可以在`main`分支外建立自己的开发分支，例如`dev-backend`、`dev-frontend`等，完成后发起Pull Request合并。在发起Pull Request之前，请先执行`git rebase main`，确保分支与主分支同步。

### fork开发
也可以将本项目fork到自己的账号下进行开发。完成后，发起Pull Request合并。在发起Pull Request之前，请先同步主仓库的`main`分支到自己的fork分支。
