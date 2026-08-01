# Slumber Wake Lab｜睡醒实验室

杨皓博面向 AI 产品与 AI 应用工程实习的职业作品集。网站先展示可核验的项目事实，再用能力透镜调整项目排序与阅读重点；IP 与 3D 只作为非阻塞增强。

线上地址：<https://uu-bb.github.io/>

## 本地运行

```bash
npm ci
npm run test
npm run build
npm run test:e2e
```

生产构建会依次校验公开数据、扫描仓库文本、执行 Vite 构建并扫描最终 `dist`。任一阶段失败都会返回非零状态。

## 数据边界

- 生产代码只读取已生成的公开数据。
- 来源使用不可逆的抽象编号，例如 `resume-product-v20260731`。
- 内部事实台账及其来源映射不属于本仓库，也不参与云端构建。
- 项目通过 `evidenceIds` 引用证据，测试数字只维护一处。
- 正式构建关闭 source map，并对最终文本制品再次执行敏感信息扫描。

## 部署

目标为 GitHub Pages 用户根站点 `https://uu-bb.github.io/`，因此 Vite `base` 固定为 `/`。推送到 `main` 后，由 GitHub Actions 校验、构建并发布静态产物。
