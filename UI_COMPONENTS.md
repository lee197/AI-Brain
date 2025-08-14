# shadcn/ui 组件配置总结

## ✅ 安装完成

### 已安装的 shadcn/ui 组件：
- ✅ **button** - 按钮组件
- ✅ **card** - 卡片容器组件
- ✅ **dialog** - 对话框/模态框组件
- ✅ **form** - 表单组件 (包含 label)
- ✅ **input** - 输入框组件
- ✅ **dropdown-menu** - 下拉菜单组件
- ✅ **avatar** - 头像组件
- ✅ **badge** - 徽章组件
- ✅ **sonner** - Toast 通知组件 (替代已弃用的 toast)

### 自动安装的依赖：
- `@radix-ui/react-*` - Radix UI 基础组件
- `class-variance-authority` - 组件变体管理
- `lucide-react` - 图标库
- `next-themes` - 主题切换支持
- `sonner` - Toast 通知库

## 🎨 主题配置

### CSS 变量系统：
- 完整的明暗主题支持
- AI Brain 品牌色彩定制
- 圆角、阴影等设计令牌

### 自定义样式类：
```css
.gradient-text    /* 渐变文字效果 */
.gradient-bg      /* 渐变背景效果 */  
.ai-shadow        /* AI Brain 阴影效果 */
.ai-glow          /* 发光效果 */
```

## 📁 文件结构

```
components/ui/
├── avatar.tsx          # 头像组件
├── badge.tsx           # 徽章组件  
├── button.tsx          # 按钮组件
├── card.tsx            # 卡片组件
├── dialog.tsx          # 对话框组件
├── dropdown-menu.tsx   # 下拉菜单组件
├── form.tsx            # 表单组件
├── input.tsx           # 输入框组件
├── label.tsx           # 标签组件
└── sonner.tsx          # Toast 组件
```

## 🚀 使用示例

访问 `/ui-demo` 页面查看所有组件的使用示例：
- 不同变体和大小的按钮
- 表单输入元素
- 导航和交互组件
- AI Brain 品牌主题展示

## 🛠 配置文件

### `components.json`
- 样式: "new-york"
- RSC: 已启用
- 基础颜色: "neutral"  
- CSS 变量: 已启用
- 图标库: "lucide"

### `app/globals.css`
- Tailwind CSS v4 配置
- 完整的主题变量定义
- AI Brain 自定义样式
- 明暗模式支持

## 📝 开发建议

1. **组件导入**：使用 `@/components/ui/*` 路径
2. **样式定制**：修改 CSS 变量而不是硬编码颜色
3. **主题切换**：使用 `next-themes` 提供的 hook
4. **图标使用**：从 `lucide-react` 导入所需图标
5. **Toast 通知**：使用 `sonner` 替代已弃用的 toast

## 🔗 相关资源

- [shadcn/ui 官方文档](https://ui.shadcn.com/)
- [Radix UI 文档](https://www.radix-ui.com/)
- [Lucide 图标库](https://lucide.dev/)
- [Sonner Toast 文档](https://sonner.emilkowal.ski/)