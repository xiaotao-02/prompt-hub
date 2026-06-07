# 全量屏幕清单（屏幕 × 状态 × 交互）

> 屏幕 ID 供 [02-interaction-map.md](./02-interaction-map.md) 与 [03-stitch-prompts.md](./03-stitch-prompts.md) 交叉引用。  
> 字段：**屏幕ID | 名称 | 触发/入口 | 区块 | 状态变体 | 关键交互 | 源码路径**

---

## 一、插件 — Popup（`EXT-POPUP-*`）

入口：[`src/popup/PopupApp.tsx`](../../src/popup/PopupApp.tsx) · 壳：[`popupShell.ts`](../../src/popup/popupShell.ts)

### EXT-POPUP-SHELL

| 字段     | 内容                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 名称     | Popup 固定壳层                                                                                         |
| 触发     | 点击扩展图标                                                                                           |
| 区块     | Header（Logo 48、标题「Prompt Hub」、服务菜单/区域截取/官网/提示词库）；可滚动主区 `data-popup-scroll` |
| 状态变体 | `settings===null` 服务区未渲染；`showServiceMenu` vs 内嵌服务卡互斥                                    |
| 关键交互 | `REQUEST_REGION_CAPTURE`；`sendOpenOptions`；外链官网                                                  |
| 源码     | `PopupApp.tsx` L219–264                                                                                |

### EXT-POPUP-SERVICE-CARD

| 字段     | 内容                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------- |
| 名称     | 首配内嵌服务卡                                                                                     |
| 触发     | `historyLoaded && list.length===0 && serviceCardOpen`                                              |
| 区块     | 琥珀摘要条；`SegmentedControl` 内置服务 \| 自定义 API；`PopupServicePane`；`PopupCompactEmptyHint` |
| 状态变体 | 内置未登录 / 已登录+配额；自定义 Key≥6+Base URL；`settings===null` 不显示                          |
| 关键交互 | 保存配置 / 登录；「更多设置」→ Options settings                                                    |
| 源码     | `PopupServiceCard.tsx`、`BuiltInPane.tsx`、`CustomApiPane.tsx`                                     |

### EXT-POPUP-SERVICE-MENU

| 字段     | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| 名称     | 头部服务下拉                                                |
| 触发     | 有历史或已配置且非内嵌卡阶段                                |
| 区块     | 摘要按钮 + `AnchoredMenuPanel`（420px）内嵌同一 ServicePane |
| 状态变体 | 已配置（紫调+QuotaBadge）；未配置（琥珀）                   |
| 关键交互 | 展开/收起；外点关闭；`onSaved` 关菜单                       |
| 源码     | `PopupServiceMenu.tsx`                                      |

### EXT-POPUP-EMPTY-GUIDE

| 字段     | 内容                                                   |
| -------- | ------------------------------------------------------ |
| 名称     | 无历史空引导                                           |
| 触发     | `historyLoaded && list.length===0 && !showServiceCard` |
| 区块     | `EmptyGuide` + `POPUP_STEPS`（右键提取、区域截取）     |
| 状态变体 | —                                                      |
| 关键交互 | 只读引导                                               |
| 源码     | `EmptyGuide.tsx`、`PopupApp.tsx`                       |

### EXT-POPUP-HISTORY-LIST

| 字段     | 内容                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------ |
| 名称     | 历史列表                                                                                         |
| 触发     | `list.length > 0`                                                                                |
| 区块     | 卡片：缩略图、provider/model/时间、prompt 3 行；工具栏复制/编辑/优化/召回/删除                   |
| 状态变体 | `historyLoaded===false` 空列表无 EmptyGuide；单版本 vs 多版本 `vN`+Chevron；`versionsExpandedId` |
| 关键交互 | 复制 `CopyFeedbackLabel`；编辑/优化→库或面板；展开版本 Enter/Space                               |
| 源码     | `PopupApp.tsx`、`usePopupVersionsDetail.ts`                                                      |

### EXT-POPUP-VERSIONS-INLINE

| 字段     | 内容                             |
| -------- | -------------------------------- |
| 名称     | 内联版本面板                     |
| 触发     | 展开某条历史                     |
| 区块     | 时间线；密度切换；>6 条折叠      |
| 状态变体 | 紧凑 / 详细；加载中乐观缓存      |
| 关键交互 | 复制；恢复此版本；删除 `confirm` |
| 源码     | `PopupVersionsInline.tsx`        |

### EXT-POPUP-BANNER-RECALL / EXT-POPUP-BANNER-REGION

| 字段     | 内容                                 |
| -------- | ------------------------------------ |
| 名称     | 召回失败 / 区域截取失败横幅          |
| 区块     | `DismissibleBanner` danger / warning |
| 关键交互 | 关闭横幅                             |
| 源码     | `PopupApp.tsx` L273–283              |

---

## 二、插件 — Options 壳层（`EXT-OPTS-*`）

入口：[`src/options/OptionsApp.tsx`](../../src/options/OptionsApp.tsx)

### EXT-OPTS-SHELL

| 字段     | 内容                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| 名称     | Options 顶栏 + Tab                                                                                          |
| 区块     | Sticky Header Logo 128；`SegmentedControl` **设置 \| 提示词库**；`SettingsAutosaveIndicator`（仅 settings） |
| 状态变体 | Tab：`settings` \| `library`；深链 `#tab` `#focus` `#dock`                                                  |
| 关键交互 | Tab 写 `sessionStorage`；深链消费后 `replaceState`                                                          |
| 源码     | `OptionsApp.tsx`、`SettingsAutosaveIndicator.tsx`                                                           |

### EXT-OPTS-SETTINGS-LOADING

| 字段 | 内容                      |
| ---- | ------------------------- |
| 名称 | 设置加载骨架              |
| 触发 | `!settings`               |
| 区块 | `SettingsLoadingSkeleton` |
| 源码 | `SettingsView.tsx`        |

### EXT-OPTS-SETTINGS-PROVIDER

| 字段     | 内容                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| 名称     | 设置 — 内置服务 / 自定义 API                                                     |
| 触发     | 左侧 nav `provider`                                                              |
| 区块     | 分段切换；`PlatformAccountPanel` / `PlatformModelPanel`；`ProviderSettingsPanel` |
| 状态变体 | builtin 未登录/已登录；custom `extract` \| `refine` 角色；拉取模型旋转态         |
| 关键交互 | `commitSettings` 自动保存；`ApiQuickSetup` 粘贴导入                              |
| 源码     | `ServiceConnectionPanel.tsx`、`ProviderSettingsPanel.tsx`                        |

### EXT-OPTS-SETTINGS-OUTPUT

| 字段     | 内容                                                                                         |
| -------- | -------------------------------------------------------------------------------------------- |
| 名称     | 设置 — 输出与策略                                                                            |
| 触发     | nav `output`                                                                                 |
| 区块     | 4 档输出风格 `ChoiceCard`；`StrategySettingsPanel`（策略、温度、Token、系统指令、预设 CRUD） |
| 关键交互 | 保存/应用/重命名/删除预设 `confirm`                                                          |
| 源码     | `OutputSettingsPanel.tsx`、`StrategySettingsPanel.tsx`                                       |

### EXT-OPTS-SETTINGS-INTERACTION

| 字段 | 内容                                                             |
| ---- | ---------------------------------------------------------------- |
| 名称 | 设置 — 交互                                                      |
| 触发 | nav `interaction`                                                |
| 区块 | Popup 工具栏动作（库 vs 面板）；随机强度；保存历史；面板自动聚焦 |
| 源码 | `InteractionSettingsPanel.tsx`                                   |

### EXT-OPTS-SETTINGS-DATA

| 字段     | 内容                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| 名称     | 设置 — 数据与备份                                                            |
| 触发     | nav `data`                                                                   |
| 区块     | 目录连接状态；同步/恢复/更换/解除；手动 JSON 导出/恢复                       |
| 状态变体 | 未配置 / 已配置权限正常 / 权限过期；FSA 不支持 warning                       |
| 关键交互 | `ConfirmDialog`（恢复、解除、JSON 合并/替换）；`DecisionModal`（发现旧备份） |
| 源码     | `DataPersistence.tsx`、`dataPersistence/*`                                   |

### EXT-OPTS-SETTINGS-UPDATES

| 字段     | 内容                                                |
| -------- | --------------------------------------------------- |
| 名称     | 设置 — 扩展更新                                     |
| 触发     | nav `updates`                                       |
| 区块     | 当前版本；公告/最低版本 Banner；检查更新 / 立即更新 |
| 状态变体 | `UpdateLoadingSkeleton`；`busy` check \| apply      |
| 源码     | `UpdateSection.tsx`                                 |

---

## 三、插件 — 提示词库（`EXT-LIB-*`）

入口：[`src/options/PromptLibrary/index.tsx`](../../src/options/PromptLibrary/index.tsx)

### EXT-LIB-SHELL

| 字段     | 内容                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------- |
| 名称     | 库 Tab 主布局                                                                                       |
| 区块     | 左侧 `FolderTree`（可隐藏、可拖宽）；工具栏搜索/视图切换/筛选/复制导出清空；主列表；`BulkActionBar` |
| 状态变体 | 侧栏隐藏；列表 vs 网格                                                                              |
| 源码     | `PromptLibraryView.tsx`                                                                             |

### EXT-LIB-FOLDER-EMPTY

| 字段 | 内容                 |
| ---- | -------------------- |
| 名称 | 空项目树             |
| 区块 | 「还没有项目」+ 创建 |
| 源码 | `FolderTree.tsx`     |

### EXT-LIB-LIST-LOADING / EXT-LIB-LIST-ERROR

| 字段 | 内容                              |
| ---- | --------------------------------- |
| 名称 | 列表加载 / 加载错误               |
| 区块 | `AsyncStateBlock` loading / error |
| 源码 | `PromptLibraryView.tsx`           |

### EXT-LIB-EMPTY / EXT-LIB-NO-MATCH

| 字段 | 内容                                                    |
| ---- | ------------------------------------------------------- |
| 名称 | 无数据 / 筛选无匹配                                     |
| 区块 | `EmptyState`+`EmptyGuide` 三步；`NoMatchState`+清除筛选 |
| 源码 | `PromptLibraryView.tsx`                                 |

### EXT-LIB-ITEM-LIST / EXT-LIB-ITEM-GRID

| 字段     | 内容                                                     |
| -------- | -------------------------------------------------------- |
| 名称     | 列表行 / 网格卡                                          |
| 状态变体 | hover；多选；置顶高亮                                    |
| 关键交互 | 打开浮动面板；复制；置顶；跳转原图；移动；删除 `confirm` |
| 源码     | `ItemRow.tsx`、`ItemGridCard.tsx`                        |

### EXT-LIB-BULK-BAR

| 字段     | 内容                                 |
| -------- | ------------------------------------ |
| 名称     | 多选底部浮条                         |
| 触发     | 有选中项                             |
| 关键交互 | 全选、复制、导出、移动到、删除、取消 |
| 源码     | `BulkActionBar.tsx`                  |

### EXT-LIB-FLOATING-PANEL

| 字段     | 内容                                                  |
| -------- | ----------------------------------------------------- |
| 名称     | 库内浮动编辑面板                                      |
| 区块     | Shadow 浮层；`PanelSuccessBody`；标题「提示词库编辑」 |
| 状态变体 | `dock` refine \| versions \| null                     |
| 关键交互 | 关闭；跳转原图；共用 refine 进度                      |
| 源码     | `LibraryFloatingPanel.tsx`、`PanelSuccessBody.tsx`    |

---

## 四、插件 — Content 浮动面板（`EXT-PANEL-*`）

入口：[`src/content/panel/PanelApp.tsx`](../../src/content/panel/PanelApp.tsx) · 状态：[`state.ts`](../../src/content/panel/state.ts)

### EXT-PANEL-COMPOSE-IMAGE

| 字段     | 内容                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 名称     | 收集参考 — 图片                                                                                                          |
| 触发     | `status=compose`，图片模式                                                                                               |
| 区块     | Header「收集参考图」；空 dropzone / `ReferenceStrip`；URL+添加+本地；策略+输出下拉；提取材质/风格；主 CTA **生成提示词** |
| 状态变体 | 0 图空态；1–8 图；满 8 disabled                                                                                          |
| 关键交互 | `run-extract` / `run-extract-material` / `run-extract-style`；`add-ref-url` / `pick-ref-file` / `remove-reference`       |
| 源码     | `ComposePanel.tsx`                                                                                                       |

### EXT-PANEL-COMPOSE-VIDEO

| 字段     | 内容                                                           |
| -------- | -------------------------------------------------------------- |
| 名称     | 收集参考 — 视频帧                                              |
| 触发     | compose + video tab                                            |
| 区块     | `ComposeVideoStudio`：预览、scrubber、片段起止、**采样到参考** |
| 关键交互 | `sample-video-segment-to-refs`；`compose-set-mode`             |
| 源码     | `ComposeVideoStudio.tsx`、`ComposeVideoPicker.tsx`             |

### EXT-PANEL-LOADING

| 字段     | 内容                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 名称     | 反推进行中                                                                                                                              |
| 触发     | `status=loading`                                                                                                                        |
| 区块     | Header 固定文案+`ModelDropdown`；只读参考条；进度条+stage；流式 `PromptEditor`；`RefineBlock`（禁用调整）；`VersionsSidebar`+并行占位行 |
| 状态变体 | stage: fetching \| calling \| streaming \| finalizing；有 versions 侧栏                                                                 |
| 关键交互 | 复制（有 partial）；120s stall → error                                                                                                  |
| 源码     | `LoadingPanel.tsx`、`extractStream.ts`                                                                                                  |

### EXT-PANEL-SUCCESS

| 字段     | 内容                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| 名称     | 提示词已生成                                                                                                        |
| 触发     | `status=success`                                                                                                    |
| 区块     | 可删参考条；`VideoShotOutline`（≥2 分镜）；可编辑区；`MetaRow`；`RefineBlock`；`ActionsBar`；可选 `VersionsSidebar` |
| 状态变体 | dirty；`versionsOpen`；refining；并行 extract；密度 compact/comfortable                                             |
| 关键交互 | save / run-refine / one-click-refine / copy / toggle-versions / beginPanelReExtract                                 |
| 源码     | `SuccessPanel.tsx`、`PanelSuccessBody.tsx`                                                                          |

### EXT-PANEL-ERROR

| 字段 | 内容                                |
| ---- | ----------------------------------- |
| 名称 | 提取失败                            |
| 触发 | `status=error`                      |
| 区块 | `error-msg`；参考条；打开设置；重试 |
| 源码 | `ErrorPanel.tsx`                    |

### EXT-PANEL-VERSIONS-SIDEBAR

| 字段     | 内容                                                             |
| -------- | ---------------------------------------------------------------- |
| 名称     | 历史版本侧栏                                                     |
| 触发     | `versionsOpen`                                                   |
| 区块     | 计数；密度切换；版本行；Extract/Refine 占位「生成中」            |
| 关键交互 | select-version / copy-version / restore-version / delete-version |
| 源码     | `VersionsSidebar.tsx`、`VersionList.tsx`                         |

### EXT-PANEL-DIALOG-CONFIRM-DELETE-VERSION

| 字段     | 内容                    |
| -------- | ----------------------- |
| 名称     | 删除版本确认            |
| 触发     | delete-version（>1 条） |
| 关键交互 | 确认 / 取消             |
| 源码     | `VersionList.tsx`       |

---

## 五、插件 — 区域框选（`EXT-REGION-*`）

| 屏幕ID             | 名称             | 触发                        | 状态               | 交互                                  | 源码               |
| ------------------ | ---------------- | --------------------------- | ------------------ | ------------------------------------- | ------------------ |
| EXT-REGION-CAPTURE | 全屏框选 overlay | Ctrl+Shift+E / popup / 右键 | 拖拽选框；Esc 取消 | 松开→`REGION_CAPTURE_CONFIRM`→compose | `regionCapture.ts` |

> 不在 Shadow 面板内；z-index 低于面板 host。

---

## 六、官网 — 全局与营销（`WEB-*`）

壳层：[`website/app/layout.tsx`](../../website/app/layout.tsx)、[`SiteHeader.tsx`](../../website/components/SiteHeader.tsx)

### WEB-HEADER-DESKTOP / WEB-HEADER-MOBILE-DRAWER

| 字段     | 内容                                                    |
| -------- | ------------------------------------------------------- |
| 名称     | 营销顶栏 / 移动抽屉                                     |
| 状态变体 | `loggedIn` null/false/true；路由高亮；`/admin` 隐藏头尾 |
| 关键交互 | 汉堡→全屏遮罩抽屉；安装扩展 CTA                         |
| 源码     | `SiteHeader.tsx`                                        |

### WEB-HOME

| 字段     | 内容                                                       |
| -------- | ---------------------------------------------------------- |
| 名称     | 首页 `/`                                                   |
| 区块     | HomeHero；Workflow 5 步 stepper；Feature 6 卡；CTA         |
| 状态变体 | Workflow 步骤 1–5；懒加载 MockSkeleton                     |
| 关键交互 | 步骤点击/键盘←→；CTA→商店、quickstart                      |
| 源码     | `website/app/page.tsx`、`HomeHero.tsx`、`WorkflowMock.tsx` |

### WEB-FEATURES

| 字段 | 内容                                       |
| ---- | ------------------------------------------ |
| 名称 | 功能 `/features`                           |
| 区块 | PageHero；5× FeatureSection + mock 变体    |
| 源码 | `features/page.tsx`、`FeatureSections.tsx` |

### WEB-PRICING

| 字段     | 内容                                     |
| -------- | ---------------------------------------- |
| 名称     | 定价 `/pricing`                          |
| 区块     | Hero；`#recharge` 套餐；FAQ；CTA         |
| 状态变体 | 套餐 loading；featured 卡                |
| 源码     | `pricing/page.tsx`、`PricingSection.tsx` |

### WEB-RECHARGE-MODAL-IDLE / MOCK / QR / MANUAL / ERROR / UNAUTH

| 字段     | 内容                                                             |
| -------- | ---------------------------------------------------------------- |
| 名称     | 充值弹窗各阶段                                                   |
| 触发     | 点套餐卡                                                         |
| 状态变体 | payPanel: idle \| mock \| qr \| manual；未登录；创建订单 loading |
| 关键交互 | 支付方式 radio；模拟支付；QR 轮询；取消                          |
| 源码     | `RechargeModal.tsx`、`useRecharge.ts`                            |

### WEB-DOWNLOAD / WEB-DOCS-HUB / WEB-DOCS-QUICKSTART / WEB-DOCS-PROVIDERS / WEB-DOCS-FAQ

| 字段 | 内容                               |
| ---- | ---------------------------------- |
| 名称 | 下载与文档子页                     |
| 区块 | Docs 侧栏 TOC；推荐路径；指南网格  |
| 源码 | `website/app/download/`、`docs/**` |

### WEB-PRIVACY / WEB-TERMS

| 字段 | 内容                                 |
| ---- | ------------------------------------ |
| 名称 | 隐私 / 条款                          |
| 区块 | `prose-docs` 长文                    |
| 源码 | `privacy/page.tsx`、`terms/page.tsx` |

### WEB-ACCOUNT-LOGIN

| 字段     | 内容                                            |
| -------- | ----------------------------------------------- |
| 名称     | 账户未登录                                      |
| 区块     | 邮箱登录；Google One Tap；ExtensionSetupDetails |
| 状态变体 | dev 直登；`emailInvalid`；`sendingEmail`        |
| 源码     | `AccountPageClient.tsx`、`useAuth.ts`           |

### WEB-ACCOUNT-OVERVIEW / USAGE / ACCESS / ORDERS

| 字段     | 内容                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| 名称     | 账户已登录四分区                                                                                          |
| 状态变体 | `accountLoading`；低余额 banner；用量 4 tab × 周期 loading/error；订单空/列表/退款 Dialog/继续支付 Dialog |
| 源码     | `AccountPageClient.tsx`、`UsageDashboard.tsx`、`AccountOrderHistory.tsx`                                  |

### WEB-ERROR-GLOBAL

| 字段 | 内容                      |
| ---- | ------------------------- |
| 名称 | 路由错误页                |
| 区块 | 错误信息；重试；返回首页  |
| 源码 | `error.tsx`、`RouteError` |

---

## 七、运营后台（`ADM-*`）

入口：[`website/app/admin/page.tsx`](../../website/app/admin/page.tsx)

### ADM-GATE-LOADING / UNAUTH / FORBIDDEN / ERROR / GRANTED

| 字段     | 内容                    |
| -------- | ----------------------- |
| 名称     | Admin 鉴权门            |
| 状态变体 | `useAdminAccess` 五态   |
| 关键交互 | 重试；→ `/account` 登录 |
| 源码     | `AdminGate.tsx`         |

### ADM-SHELL

| 字段     | 内容                                                                 |
| -------- | -------------------------------------------------------------------- |
| 名称     | 后台壳层                                                             |
| 区块     | 侧栏 9 Tab（lg+）/ 移动 Pill；顶栏搜索⌘K；`AdminContextPanel`（xl+） |
| 关键交互 | `#hash` 切换 Tab；`AdminCommandPalette`                              |
| 源码     | `AdminShell.tsx`、`AdminPageClient.tsx`                              |

### ADM-OVERVIEW

| Tab         | 状态                              | 区块                                   | 源码                |
| ----------- | --------------------------------- | -------------------------------------- | ------------------- |
| `#overview` | loading 指标「—」/ error / 有数据 | 周期切换；图表；按日表；Top3；错误分布 | `AdminOverview.tsx` |

### ADM-USERS

| 字段     | 内容                                            |
| -------- | ----------------------------------------------- |
| 名称     | 用户管理                                        |
| 状态变体 | Filter 已应用；行选中高亮；Drawer loading/error |
| 关键交互 | 行点击→`AdminUserDetailDrawer`；改余额→Confirm  |
| 源码     | `AdminUsers.tsx`、`AdminUserDetailDrawer.tsx`   |

### ADM-ORDERS

| 字段     | 内容                            |
| -------- | ------------------------------- |
| 名称     | 充值订单                        |
| 关键交互 | 行点击→`AdminOrderDetailDrawer` |
| 源码     | `AdminOrders.tsx`               |

### ADM-REFUNDS

| 字段     | 内容                                       |
| -------- | ------------------------------------------ |
| 名称     | 退款审批                                   |
| 状态变体 | 默认 pending 筛选；待审 metric             |
| 关键交互 | 批准 Confirm destructive；驳回 Dialog+备注 |
| 源码     | `AdminRefunds.tsx`                         |

### ADM-LOGS

| 字段     | 内容                   |
| -------- | ---------------------- |
| 名称     | 请求日志               |
| 关键交互 | 行点击→异步详情 Drawer |
| 源码     | `AdminRequestLogs.tsx` |

### ADM-UPSTREAMS

| 字段     | 内容                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 名称     | 上游接入                                                                  |
| 状态变体 | empty CTA；UpstreamCard 列表；FormDialog；DetailDialog；Confirm 删除/禁用 |
| 关键交互 | 批量测试/同步；倍率；熔断 badge                                           |
| 源码     | `AdminUpstreams.tsx`、`adminUpstreams/*`                                  |

### ADM-PAYMENTS

| 字段     | 内容                                     |
| -------- | ---------------------------------------- |
| 名称     | 支付管理                                 |
| 状态变体 | routingDirty；平台 Card；编辑凭据 Dialog |
| 源码     | `AdminPayments.tsx`、`adminPayments/*`   |

### ADM-PRICING

| 字段     | 内容                           |
| -------- | ------------------------------ |
| 名称     | 定价管理                       |
| 关键交互 | 新增/编辑 Dialog；删除 Confirm |
| 源码     | `AdminPricing.tsx`             |

### ADM-AUDIT

| 字段     | 内容                                      |
| -------- | ----------------------------------------- |
| 名称     | 审计日志                                  |
| 关键交互 | 行点击→`AdminAuditDetailDrawer`；CSV 导出 |
| 源码     | `AdminAuditLogs.tsx`                      |

### ADM-SHARED-TABLE-LOADING / EMPTY / ERROR

| 字段 | 内容                                            |
| ---- | ----------------------------------------------- |
| 名称 | 共享表格三态                                    |
| 区块 | Skeleton 5 行；`EmptyState`；`ErrorBanner`+重试 |
| 源码 | `AdminDataTable.tsx`                            |

### ADM-SHARED-CONFIRM / ADM-SHARED-DETAIL-DIALOG

| 字段 | 内容                                              |
| ---- | ------------------------------------------------- |
| 名称 | 确认 / 详情 Dialog                                |
| 源码 | `AdminConfirmDialog.tsx`、`AdminDetailDialog.tsx` |

---

## 八、屏幕数量汇总（Stitch 规划用）

| 区域         | 主屏约数       | 须单独补的状态屏约数                  |
| ------------ | -------------- | ------------------------------------- |
| Popup        | 6              | +4（loading/empty 变体、Banner）      |
| Options 设置 | 5              | +2（loading、Dialog）                 |
| 提示词库     | 8              | +3                                    |
| Content 面板 | 8              | +6（loading stages、Dialog）          |
| 区域框选     | 1              | +1（Esc 取消）                        |
| 官网         | 18             | +12（Recharge、Account、Workflow 步） |
| 后台         | 9 Tab + Gate 5 | +15（每 Tab empty/error/Drawer）      |

**合计建议 Stitch 画板：约 90–110 帧**（含状态变体）。生成时按 [03-stitch-prompts.md](./03-stitch-prompts.md) 每批 2–4 主屏推进。
