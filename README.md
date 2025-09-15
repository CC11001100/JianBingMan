# 🥞 煎饼侠 - 专业煎饼计时器

<div align="center">

[![Language: 中文](https://img.shields.io/badge/Language-中文-red.svg)](README.md) [![Language: English](https://img.shields.io/badge/Language-English-blue.svg)](README_EN.md)

**专业的煎饼翻面计时应用，让每一张煎饼都完美翻面！**

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-brightgreen.svg)](https://cc11001100.github.io/JianBingMan/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.14.20-0081CB.svg?logo=mui)](https://mui.com/)

</div>

## ✨ 项目简介

煎饼侠是一款专为煎饼制作而设计的智能计时器应用。无论您是街边煎饼摊主，还是在家制作美味煎饼的料理爱好者，这款应用都能帮您精确掌控煎饼的翻面时机，确保每一张煎饼都达到完美的金黄色泽。

## 🚀 在线体验

🌟 **[立即体验 煎饼侠](https://cc11001100.github.io/JianBingMan/)**

支持桌面端和移动端，推荐在手机浏览器中使用以获得最佳体验。

## 📱 应用截图

<!-- 待添加移动端截图 -->
*移动端界面截图将通过自动化测试工具生成并展示*

## 🎯 核心功能

### ⏱️ 精准计时
- **智能计时器**: 默认20秒煎饼翻面计时，可根据需要灵活调整
- **实时进度**: 圆形进度条直观显示剩余时间
- **快速调节**: 支持±5秒快速时间调整

### 🔄 灵活控制
- **暂停/继续**: 可随时暂停和继续计时
- **一键重置**: 快速重新开始新一轮计时
- **运行时调节**: 计时过程中也可调整时间

### 🎚️ 时间校准
- **专业校准**: 通过实际煎饼测试校准最佳翻面时间
- **智能同步**: 校准后自动调整当前计时进度
- **精确记录**: 保存个人专属的最佳翻面时间

### 🔊 多重提醒
- **语音提醒**: 支持自定义语音录制和系统语音合成
- **音效提醒**: 多种提示音效可选
- **振动提醒**: 手机振动提醒（移动端）
- **个性化设置**: 可调节音量、语音速度、音调等参数

### 📱 移动优化
- **屏幕常亮**: 计时期间防止手机锁屏
- **响应式设计**: 完美适配各种屏幕尺寸
- **触摸友好**: 针对触屏操作优化的用户界面

### 💾 智能存储
- **设置保存**: 自动保存个人偏好设置
- **历史记录**: 记录每次计时历史
- **离线可用**: 支持PWA离线使用

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18.2.0 | 现代化前端框架 |
| **TypeScript** | 5.2.2 | 类型安全的JavaScript |
| **Vite** | 5.0.8 | 快速构建工具 |
| **Material-UI** | 5.14.20 | Google Material Design组件库 |
| **Emotion** | 11.11.1 | CSS-in-JS样式解决方案 |

## 📁 项目结构

```
JianBingMan/
├── public/                 # 静态资源
├── src/
│   ├── components/         # React组件
│   │   └── PancakeTimer/   # 主要计时器组件
│   │       ├── PancakeTimer.tsx       # 主计时器组件
│   │       ├── SettingsDialog.tsx     # 设置对话框
│   │       ├── CalibrationDialog.tsx  # 校准对话框
│   │       ├── TimeIntervalSelector.tsx # 时间选择器
│   │       ├── VoiceRecorder.tsx      # 语音录制器
│   │       └── *.css                  # 组件样式
│   ├── utils/              # 工具函数
│   │   ├── storage.ts      # 本地存储管理
│   │   ├── speechSynthesis.ts # 语音合成功能
│   │   ├── soundEffects.ts # 音效管理
│   │   └── wakeLock.ts     # 屏幕常亮功能
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── index.html              # HTML入口文件
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── vite.config.ts          # Vite构建配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/cc11001100/JianBingMan.git
   cd JianBingMan
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

4. **打开浏览器**
   访问 `http://localhost:5173` 即可使用

### 构建部署

**生产构建**
```bash
npm run build
# 或
yarn build
```

**预览构建结果**
```bash
npm run preview
# 或
yarn preview
```

**GitHub Pages部署**
```bash
npm run build:gh-pages
# 构建完成后，将dist目录内容部署到GitHub Pages
```

## 📖 使用指南

### 基础使用

1. **设定时间**: 使用+/-按钮调整煎饼翻面时间
2. **开始计时**: 点击"开始"按钮开始计时
3. **监控进度**: 观察圆形进度条和倒计时显示
4. **翻面提醒**: 时间到达时会有语音、音效、振动提醒
5. **继续计时**: 翻面后计时器会自动重新开始

### 高级功能

1. **时间校准**: 
   - 点击"时间校准"按钮
   - 实际煎制一张煎饼来测试最佳时间
   - 保存校准结果作为默认时间

2. **个性化设置**:
   - 点击"设置"按钮打开设置面板
   - 调整语音、音效、振动等提醒方式
   - 录制个人专属提醒语音
   - 调节音量、语音速度等参数

3. **屏幕常亮**:
   - 计时开始后自动激活屏幕常亮
   - 右上角灯泡图标显示常亮状态
   - 计时停止后自动取消常亮

## 🎨 设计特色

### 用户界面设计
- **亲密性**: 相关功能分组布局，操作逻辑清晰
- **对齐**: 所有元素规整对齐，视觉效果统一
- **重复**: 统一的色彩搭配和交互风格
- **对比**: 重要按钮和状态信息突出显示

### 移动端优化
- 专为触屏操作设计的按钮尺寸
- 适配不同屏幕密度的图标和文字
- 支持横竖屏自动适应
- 优化的触摸反馈和视觉效果

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

### 开发环境设置
1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 代码规范
- 使用 TypeScript 进行开发
- 遵循 ESLint 配置的代码风格
- 每个组件应有对应的样式文件
- 添加适当的注释和文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 优秀的前端框架
- [Material-UI](https://mui.com/) - 精美的组件库
- [Vite](https://vitejs.dev/) - 快速的构建工具
- 所有为这个项目贡献代码和建议的开发者

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- **GitHub Issues**: [提交问题](https://github.com/cc11001100/JianBingMan/issues)
- **项目主页**: [GitHub 仓库](https://github.com/cc11001100/JianBingMan)

---

<div align="center">
<p>用心制作，只为那完美的煎饼时刻 🥞</p>
<p>© 2024 煎饼侠 - 让每一张煎饼都完美翻面</p>
</div>
