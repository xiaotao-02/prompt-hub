# 多上游模型聚合

运营后台可配置多个上游 API；后端自动抓取各上游 `GET /models`，融合成统一模型目录供插件「内置服务」用户使用。对外公开 id 为**短模型名**（如 `gpt-4o`）；多厂商提供同名模型时按**售价从低到高**依次尝试，失败或上游额度用尽时自动 failover 到下一厂商，并按**实际命中厂商**的售价扣点。

## 三级结构（厂商 → API Key → 模型）

| 层级    | 存储              | 说明                                                                                                                             |
| ------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 厂商    | `upstreams`       | baseUrl、协议、倍率、model_map；运营目录仍按厂商维度管理                                                                         |
| API Key | `upstream_keys`   | 每 Key 独立 id、启停、备注、`sort_order`；代理按 `sort_order` 轮询 enabled Key，认证失败时按同顺序轮换；日志记 `upstream_key_id` |
| 模型    | `upstream_models` | 按厂商同步 `/models`，运营可禁用或改倍率覆盖                                                                                     |

## 上游协议（`/admin` 接入新厂商）

| 协议        | 说明                                                                   | 模型自动同步                                             |
| ----------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `openai`    | OpenAI Chat Completions 兼容（中转站、Ollama `/v1` 等）                | 支持：`GET {baseUrl}/models`                             |
| `anthropic` | Anthropic Messages API（`x-api-key` + `/v1/messages`）                 | **不支持**；请用「手动模型路由」映射公开 id → 上游模型名 |
| `gemini`    | Google `generateContent` / `streamGenerateContent`（`x-goog-api-key`） | **不支持**；同上                                         |

代理入口仍为 OpenAI 形状的 `POST /v1/chat/completions`（含 `image_url` 视觉输入）；非 `openai` 协议由 [`services/api/src/upstream/adapters/`](../services/api/src/upstream/adapters/) 翻译请求/响应与流式 SSE。厂商预设中保留 OpenAI 兼容与原生两套（如 Anthropic / Gemini）。

## 架构

```mermaid
flowchart LR
  subgraph admin [运营后台 /admin]
    upCRUD[厂商 CRUD + 倍率]
    keyCRUD[Key 子资源 CRUD / 测试]
    syncBtn[刷新模型]
    override[禁用 / 改倍率覆盖]
  end
  subgraph api [services/api]
    sync[syncUpstreamModels]
    cache[(upstream_models)]
    listM[GET /v1/models]
    proxy[POST /v1/chat/completions]
  end
  subgraph ext [扩展 platform 模式]
    picker[ModelPicker 短名列表]
    call[反推 / 改写]
  end
  upCRUD --> sync
  syncBtn --> sync
  sync --> cache
  override --> cache
  cache --> listM
  listM --> picker
  picker --> call
  call -->|model=短模型名| proxy
```

## 模型 ID 与路由优先级

| 规则          | 说明                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| 公开 model id | 短模型名，如 `gpt-4o`（`GET /v1/models` 按短名去重）                                                        |
| 同名合并路由  | 未命中手动路由时，聚合表内所有 enabled 同名模型按 **厂商 priority 升序 → 售价升序 → id** 组成 failover 候选 |
| 厂商 priority | `upstream_settings.upstream_priority` 有序 id 数组；后台列表可上下调整；新建 append 末尾                    |
| 遗留入站格式  | `上游名/模型名` 仍可解析（单上游、不进公开列表），扩展侧会自动迁移为短名                                    |
| 路由优先级    | 手动 `model_routes` **优先** → 遗留前缀 id → 短名合并路由                                                   |
| 未知 model    | 抛 `UnknownModelError`（legacy 单上游透传模式除外）                                                         |
| Failover 重试 | 上游 402 / 429 / 5xx 可切换下一候选（`UPSTREAM_FAILOVER_ENABLED`，默认开启）                                |
| 扣费          | 预扣按排序后**首选候选**估算；结算按**实际命中上游**的 `deriveSellPricing` 单价                             |

## 定价（成本 × 倍率）

- 上游 `/models` 返回 OpenRouter 风格 `pricing.prompt` / `pricing.completion`（per-token USD）→ 存为 **per-1k 成本**
- 无价格时：非对话模型不填兜底；对话模型回退 `UPSTREAM_INPUT_PRICE_PER_1K` / `UPSTREAM_OUTPUT_PRICE_PER_1K`
- **售价单价** = 成本 × 有效倍率；再经现有 [`billing.ts`](../services/api/src/billing.ts) `pointsFromUsage` 扣点

倍率层级（就近覆盖）：

1. 模型 `markup_override`（`upstream_models.markup_override`）
2. 上游 `markup`（`upstreams.markup`）
3. 全局 `default_markup`（`upstream_settings`，默认 `5`）

## 模型范围过滤（已废弃）

`upstreams.model_filter` 列与 `keep-models` API **仍保留于 DB/接口**（兼容旧数据与脚本），但 **同步已不再读取过滤规则**：`syncUpstreamModels` 全量入库上游 `/models` 返回的条目。

运营在后台「模型目录」用 **逐条 Switch**、**全部开启/关闭**、**仅识图批量开启** 控制对用户开放哪些模型；明显非对话模型（embedding/tts 等）同步后默认 `enabled=0`，可按需手动启用。

## 同步策略

| 触发                  | 行为                                                            |
| --------------------- | --------------------------------------------------------------- |
| 新建/更新上游         | 后台异步 `syncUpstreamModels(id, { force: true })`              |
| Admin「刷新模型」     | `POST /v1/admin/upstream-config/upstreams/:id/sync-models`      |
| 用户 `GET /v1/models` | 对**从未同步过**的上游后台拉取一次（`maybeSyncStaleUpstreams`） |
| Admin 手动刷新        | 带 `{ force: true }` 忽略 1h 缓存                               |

同步时 **不覆盖** 运营已有 `enabled` / `markup_override`。明显非对话模型（embedding/tts/whisper 等）默认 `enabled=0`，可在后台手动启用。

## SQLite 表（迁移 `025_upstream_models`）

| 表 / 列                               | 用途                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `upstreams.markup`, `upstreams.label` | 厂商默认倍率、展示名                                       |
| `upstream_keys`                       | 厂商下 API Key：加密存储、enabled、label                   |
| `request_logs.upstream_key_id`        | 代理请求使用的 Key id（用量按 Key 聚合）                   |
| `upstream_models`                     | 缓存各上游模型：成本、vision、override、enabled、synced_at |
| `upstream_settings.default_markup`    | 全局默认倍率                                               |

手动路由表 `model_routes` 仍可用于显式 failover、固定别名、覆盖定价；与按短名去重后的聚合模型 **union** 出现在 `GET /v1/models`（手动 id 优先，不重复）。日常多厂商同名由 `resolveMergedAggregatedRoute` 自动合并，无需逐条手动配置。

## Admin API（`/v1/admin`）

| 方法    | 路径                                                    | 说明                                                                            |
| ------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| GET     | `/upstream-config/upstreams/:id/keys`                   | Key 列表（掩码 + 用量统计）                                                     |
| POST    | `/upstream-config/upstreams/:id/keys`                   | 新增 Key `{ key, label? }`                                                      |
| PUT     | `/upstream-config/upstreams/:id/keys/:keyId`            | `{ enabled?, label? }`                                                          |
| DELETE  | `/upstream-config/upstreams/:id/keys/:keyId`            | 删除 Key（至少保留一个）                                                        |
| POST    | `/upstream-config/upstreams/:id/keys/:keyId/test`       | 单 Key 连通测试                                                                 |
| GET     | `/upstream-config`                                      | 含 `defaultMarkup`                                                              |
| GET/PUT | `/upstream-config/default-markup`                       | 读写全局倍率                                                                    |
| GET     | `/upstream-config/aggregated-models`                    | 按上游分组的聚合模型（成本/倍率/售价/点数预览）                                 |
| POST    | `/upstream-config/upstreams/:id/sync-models`            | 手动同步该上游模型                                                              |
| PUT     | `/upstream-config/aggregated-models/:upstreamId/:model` | `{ enabled?, markupOverride? }`                                                 |
| POST    | `/upstream-config/upstreams/:id/batch-enable`           | 批量开关：`{ enabled: true/false }` 全量；`{ visionOnly: true }` 仅保留识图模型 |
| GET     | `/upstream-config/upstreams/:id/available-models`       | **已废弃** 实时拉上游全部模型（后台 UI 已移除）                                 |
| POST    | `/upstream-config/upstreams/:id/keep-models`            | **已废弃** 更新 `modelFilter.keep` 后重同步                                     |
| POST    | `/upstream-config/test-draft`                           | 保存前连通测试（不写 DB）                                                       |
| GET     | `/upstream-config/upstreams/:id/sync-status`            | `lastSyncAt` / `lastSyncStatus` / `inflight`                                    |

`SyncUpstreamModelsResult.status`：`synced` | `empty_preserved` | `skipped_protocol` | `skipped_ttl` | `failed`。

`GET /upstream-config` 上游项扩展：`enabledKeyCount`、`totalKeyCount`、`lastSyncAt`、`lastSyncStatus`、`lastSyncError`、`lastConnectivityOk`、`lastConnectivityAt`。

上游 CRUD 请求体可选字段：`markup`、`label`、`modelMap`。`modelFilter` 字段 **已废弃**（接口仍接受但同步忽略）。`PUT` 更新响应含 `syncPending: true` 时表示后台正在重同步模型目录。

## 运营后台 UI（`/admin` 上游 Tab）

- **接入向导**（`UpstreamOnboardingWizard`）：厂商 → test-draft 连通 → 计费 → 创建；openai 完成后进「模型目录」Tab，anthropic/gemini 进「公开路由」Tab。
- **详情弹窗**（`UpstreamDetailDrawer` + `AdminDetailDialog headerLayout="split"`）：概览 / API Keys / 模型目录 / 公开路由 / 设置；顶栏标题与操作同一行。
- 顶栏「全部公开路由」只读汇总；页面底部不再折叠全局手动路由区。

运营后台「模型目录」工具栏支持 **只显示识图模型**（纯前端视图过滤）、**只开启识图模型**（`vision === true` 启用、其余禁用）与 **全部开启/全部关闭** 一键批量操作。单模型**启用**直接切换；**禁用**需确认。

## 插件侧（platform 模式）

- `GET {PLATFORM_API_URL}/v1/models` → 短模型名 id + 扩展字段 `vision`、`pricingPreview`（最便宜候选）
- [`src/lib/api/models.ts`](../src/lib/api/models.ts)：优先用后端 `vision`，否则启发式；platform 列表短名去重
- [`src/lib/storage/settings.ts`](../src/lib/storage/settings.ts)：加载时把遗留 `厂商/模型` 迁移为短名
- [`src/options/ModelPicker.tsx`](../src/options/ModelPicker.tsx)：直接展示短模型名
- 反推/改写请求体 `model` 即 `gpt-4o` 等形式，无需改 extract/refine 协议

## 关键源码

| 模块            | 路径                                                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 模型同步        | [`services/api/src/upstream/syncModels.ts`](../services/api/src/upstream/syncModels.ts)                                                                                                                                                                                              |
| 倍率 / 公开 id  | [`services/api/src/upstream/pricing.ts`](../services/api/src/upstream/pricing.ts)                                                                                                                                                                                                    |
| 路由 + 列表聚合 | [`services/api/src/upstream/routes.ts`](../services/api/src/upstream/routes.ts)                                                                                                                                                                                                      |
| 注册表          | [`services/api/src/upstream/registry.ts`](../services/api/src/upstream/registry.ts)                                                                                                                                                                                                  |
| Admin 业务      | [`services/api/src/admin/upstreamConfig.ts`](../services/api/src/admin/upstreamConfig.ts)                                                                                                                                                                                            |
| 代理入口        | [`services/api/src/routes/proxy.ts`](../services/api/src/routes/proxy.ts)                                                                                                                                                                                                            |
| 后台 UI         | [`AdminUpstreams.tsx`](../website/components/admin/AdminUpstreams.tsx)、[`UpstreamDetailDrawer.tsx`](../website/components/admin/adminUpstreams/UpstreamDetailDrawer.tsx)、[`UpstreamOnboardingWizard.tsx`](../website/components/admin/adminUpstreams/UpstreamOnboardingWizard.tsx) |
| Admin API 封装  | [`website/lib/adminApi/upstream.ts`](../website/lib/adminApi/upstream.ts)                                                                                                                                                                                                            |

## 本地联调

```bash
npm run dev:previews
```

1. `http://localhost:4321/admin` → 上游接入：添加上游、设倍率、点「刷新模型」
2. 查看「聚合模型」区成本/倍率/点数预览，按需禁用或改倍率覆盖
3. 扩展设置 → 内置服务登录 → 拉取模型 → 选择短模型名 → 反推/改写验证扣点与 failover

## 测试

- [`services/api/src/upstream/syncModels.test.ts`](../services/api/src/upstream/syncModels.test.ts) — 价格解析、非对话模型过滤
- [`services/api/src/upstream/routes.aggregate.test.ts`](../services/api/src/upstream/routes.aggregate.test.ts) — 短名合并、售价排序、遗留前缀、`listPublicModels`
- [`services/api/src/proxy.test.ts`](../services/api/src/proxy.test.ts) — 合并路由 402/502 failover 与实际扣费

## 改功能时首读

1. 改同步/解析： `syncModels.ts`
2. 改扣费单价推导： `pricing.ts` + `routes.ts` `resolveRoute`
3. 改 DB： `db.ts` 迁移 + CRUD → `reloadUpstreamRegistry()`
4. 改后台： `upstreamConfig.ts` → `admin.ts` → `website/lib/adminApi/upstream.ts` → `AdminUpstreams.tsx`
5. 改插件模型列表/迁移： `models.ts` + `settings.ts` + `ModelPicker.tsx`
