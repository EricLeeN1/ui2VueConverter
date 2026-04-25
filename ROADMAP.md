# ui-to-vue-converter 升级路线图

> 基于实际项目使用反馈整理的改进计划。
> 请按优先级顺序逐步实施，每完成一轮验证后再进行下一轮。

---

## 🔴 P0 - 高优先级（解决当前核心痛点）

### 1. 智能目录结构识别

**问题现象**
- 图片放在根目录时，所有图片被合并成一个巨大文件
- `inputDir` 直接指向模块子目录时，生成的文件名缺少模块前缀
- 用户不得不临时挪动其他目录才能正确识别

**目标行为**
```
输入: designs/module-a/list/xxx.png
       designs/module-a/detail/xxx.png
识别: 模块名 = "module-a"（一级目录）
      页面名 = "list" / "detail"（二级目录）
输出: module-a-list.vue / module-a-detail.vue

输入: designs/list/xxx.png（只有一级）
识别: 模块名 = "list"
      页面名 = "index"
```

**实现方案**
- `scanner.js`: `scan()` 增加结构探测逻辑
  - 遍历所有图片，统计各级目录出现的频率
  - 如果一级目录下所有项都是子目录 → 一级=模块，二级=页面
  - 如果一级目录下直接是图片 → 一级=页面（模块名用目录名）
- 增加交互确认（TTY 环境下）：`检测到 7 个页面组：list、detail... 是否正确？(Y/n)`
- 非 TTY 环境（CI）跳过确认，直接执行

**验收标准**
- [ ] `module-a/list/` 生成 `module-a-list.vue` 或 `index.vue`
- [ ] `module-a/` 直接放图片时，能正确识别为单页面模块
- [ ] 根目录直接放图片时，给出明确警告并退出，而不是合并

---

### 2. 弹窗 vs 页面 智能区分

**问题现象**
- `modal/` 目录被当成普通页面生成了独立的 `.vue` 文件
- 弹窗设计图是浮层（半透明遮罩 + 居中卡片），却被生成了独立路由页面
- 用户需要手动删除 `modal.vue`，并把弹窗逻辑合并到父页面

**目标行为**
- 检测到浮层/弹窗设计图时，不生成独立 `.vue` 文件
- 提取弹窗内容（标题、正文、按钮文案），生成对应父页面的 `dialog.confirm()` 调用代码
- 在生成报告中标注："confirm-modal → 已合并到 module-a-detail.vue"

**弹窗识别规则（启发式）**
| 特征 | 权重 |
|------|------|
| 目录名包含"弹窗/Dialog/Modal/Toast" | +10 |
| 图片中有半透明黑色遮罩（中心区域外亮度 < 30%） | +8 |
| 内容区域仅占画面 30%~60%，且居中 | +5 |
| 画面中有"确定/取消"成对按钮 | +3 |
| 总分 ≥ 12 判定为弹窗 | |

**实现方案**
- `scanner.js`: `detectModal()` 方法，基于文件名 + 简易图像分析（可用 sharp 库读像素）
- `code-generator.js`: 弹窗不进入正常 `generate()` 流程，而是存到 `modalMap` 中
- `api-client.js`: 弹窗调用 API 时，prompt 改为"提取这个弹窗的标题、内容、按钮文案"
- 生成阶段：将提取的弹窗信息注入到对应父页面的 script 中（通过 AST 或正则插入 `dialog.confirm(...)`）

**验收标准**
- [ ] `modal/confirm-modal.png` 不生成 `modal.vue`
- [ ] `module-a-detail.vue` 的 `handleSend()` 中包含正确的 `dialog.confirm()` 调用
- [ ] 生成报告中有弹窗合并的说明行

---

### 3. CSS 语法错误自动修复

**问题现象**
- 大文件生成到末尾 CSS 未闭合，Prettier 报 `Unexpected character "EOF"`
- 错误信息没有指出是第几层的嵌套没闭合，很难定位

**目标行为**
- 生成代码后自动校验 CSS/SCSS 语法
- 自动补全缺失的 `}` 和 `</style>` 标签
- 修复失败时输出精确的位置信息

**实现方案**
- 新增 `src/core/syntax-fix.js` 模块
- 使用 `postcss-scss` parser 尝试解析 style 块
- 解析失败时，用栈结构分析 `{`/`}` 匹配情况
  - 记录每个 `{` 的行号和上下文（选择器名）
  - 到 EOF 时还有未闭合的 `{` → 在 `</style>` 前补全对应数量的 `}`
- 补全后再次尝试解析，仍失败则输出详细报告

**验收标准**
- [x] 输入一个 CSS 缺少 3 个 `}` 的代码，自动修复后能正常通过 Prettier 格式化
- [x] 无法自动修复时，输出类似：`错误：.stamp { (第955行) 未闭合，已追踪到嵌套深度5层`

---

## 🟡 P1 - 中优先级（提升使用效率）

### 4. 冗余导入自动清理

**问题现象**
- 项目配置了 `unplugin-auto-import` 和 `VantResolver`
- AI 生成的代码仍然 `import { showToast, showDialog } from 'vant'` 和 `import { ref } from 'vue'`
- 导致编译警告或类型冲突

**目标行为**
- 扫描项目根目录下的 `auto-imports.d.ts`、`components.d.ts`、`vite.config.ts`
- 自动删除已由 auto-import 提供的 import 语句

**实现方案**
- `code-generator.js` 的 `injectImports()` 后增加 `dedupeImports(code)` 步骤
- 检测方式：
  - 如果项目存在 `auto-imports.d.ts` → 删除所有 `from 'vue'`、`from 'vue-router'` 的 import
  - 如果项目存在 `components.d.ts` → 删除所有 `from 'vant'` 中对应组件的 import
- 保留非标准导入（如 `@/utils/toast`）

**验收标准**
- [x] 生成代码中不出现 `import { ref } from 'vue'`（项目有 auto-import 时）
- [x] 生成代码中不出现 `import { showToast } from 'vant'`（项目有 VantResolver 时）
- [x] 自定义导入（如 `import toast from '@/utils/toast'`）保留不变

---

### 5. 设计稿尺寸自动识别

**问题现象**
- 用户需要手动配置 `designWidth: 375` 和 `"所有尺寸乘以 2"` 的 prompt 规则
- 如果设计图是 750px 但用户没改配置，生成的代码尺寸会差一倍

**目标行为**
- 读取第一张图片的像素宽度，自动推断 designWidth
- 根据项目配置的 `rootValue` 自动计算 px 倍数

**实现方案**
- `scanner.js`: 用 `sharp` 读取图片 metadata，获取实际宽度
- 规则：
  - 图片宽度 ≈ 375px → `designWidth = 375`，如果 `rootValue = 75` → 提示"所有 px 乘以 2"
  - 图片宽度 ≈ 750px → `designWidth = 750`，无需额外处理
  - 图片宽度 ≈ 1080px → `designWidth = 1080`，按实际比例转换
- 自动把规则注入到 API prompt 中，不需要用户在配置文件里写长串提示

**验收标准**
- [ ] 375px 设计图 → prompt 自动包含"尺寸乘以 2"规则
- [ ] 750px 设计图 → prompt 不包含倍数规则
- [ ] 控制台输出：`设计图宽度: 375px，已自动启用 2x 倍数转换`

---

### 6. 增量生成模式

**问题现象**
- 每次运行都是全量生成，会把用户手动修改过的文件覆盖掉
- 比如用户改好了 `detail.vue` 里的 dialog 逻辑，重新跑一遍工具就丢了

**目标行为**
- 增加 `--incremental` 或 `--force` 参数
- 默认行为：已有文件时跳过，提示"xxx.vue 已存在，使用 --force 覆盖"

**实现方案**
- `code-generator.js`: `generate()` 中，写文件前检查 `fs.existsSync(outputPath)`
- CLI 增加 `--force` 选项
- 支持 `--only list,detail` 只生成指定页面

**验收标准**
- [ ] 第二次运行时，已有文件不被覆盖，控制台显示跳过信息
- [ ] `ui-to-vue --force` 强制覆盖已有文件
- [ ] `ui-to-vue --only detail` 只生成 detail 页面

---

### 7. 路由自动注入

**问题现象**
- 生成的路由信息打印在控制台，需要用户手动复制到 `router/index.ts`
- 容易复制错、遗漏、或造成重复路由

**目标行为**
- 自动读取项目现有的路由文件，追加新路由
- 检测重复路由（相同 path 或 name）时自动去重或报错

**实现方案**
- 新增 `--inject-router <path>` 参数，如 `--inject-router src/router/index.ts`
- 用 `recast` 或正则解析路由数组，在末尾追加新路由对象
- 检测逻辑：
  - `path` 已存在 → 报错并提示使用 `--force`
  - `name` 已存在 → 报错

**验收标准**
- [ ] 运行后 `router/index.ts` 自动追加新路由，格式与现有代码一致
- [ ] 重复 path 时给出明确错误信息，不静默覆盖
- [ ] 未指定 `--inject-router` 时保持原有控制台输出行为

---

## 🟢 P2 - 长期方向

### 8. 多 API Provider 支持

**背景**
- 目前只支持 DashScope（qwen-vl），API 挂了或额度用完就无法工作

**方案**
- 抽象 `BaseProvider` 接口：`generateVueCode(page, uiConfig)`
- 实现：
  - `DashScopeProvider`（现有）
  - `OpenAIProvider`（GPT-4V）
  - `ClaudeProvider`（Claude 3.5 Sonnet with vision）
- 配置文件中支持 `provider: "dashscope"` 或 `provider: "openai"`
- 自动重试：一个 provider 失败时尝试下一个（需要用户配置 fallback）

---

### 9. 公共组件自动抽离

**背景**
- 当前显示"识别到 0 个公共组件"
- 实际上列表页和详情页有很多重复结构（卡片列表、空状态、文件卡片）

**方案**
- 页面生成后，用 AST 对比不同页面的 template 结构相似度
- 相似度 > 80% 的节点块标记为"候选公共组件"
- 提取到 `components/` 目录，原页面替换为 `<CommonXxx />`
- 用户确认后再正式替换（避免过度抽象）

---

### 10. 图片压缩 & Token 成本优化

**背景**
- 设计图可能是高清 PNG（几百 KB 到几 MB），API 按图片 token 收费
- 当前似乎直接传原图，成本较高

**方案**
- 上传前用 `sharp` 压缩：
  - 最长边限制 1024px（保持比例缩放）
  - 质量 80%，格式转 webp（如果 API 支持）或保持 png
- 缓存已生成的页面结果，相同设计元素（如底部按钮栏）复用代码片段

---

## 实施建议

| 轮次 | 任务 | 预估改动量 | 风险 |
|------|------|-----------|------|
| 第一轮 | ~~#3 CSS 语法修复 + #4 冗余导入清理~~ ✅ | 中 | 低 |
| 第二轮 | #1 智能目录识别 + #5 尺寸自动识别 | 中 | 中 |
| 第三轮 | #2 弹窗智能区分 | 大 | 中 |
| 第四轮 | #6 增量生成 + #7 路由注入 | 中 | 低 |
| 第五轮 | #8~#10 长期功能 | 大 | 高 |

每轮完成后应：
1. 跑一遍完整的真实设计图生成流程
2. 检查生成的代码能否通过 `pnpm dev` 编译
3. 记录新发现的 edge case，更新到本文档
