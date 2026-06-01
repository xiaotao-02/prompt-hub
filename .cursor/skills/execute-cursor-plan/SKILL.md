---
name: execute-cursor-plan
description: >-
  Resume and implement a Cursor Plan saved under .cursor/plans/*.plan.md in a
  new chat. Use when the user asks to execute/continue a plan, run pending
  todos from a plan file, start work from @.cursor/plans, or 在新对话执行 plan /
  继续 plan / 按 plan 实现.
disable-model-invocation: true
---

# 在新对话执行 Cursor Plan

Plan 文件保存在工作区 `.cursor/plans/<name>_<hash>.plan.md`，不随旧对话消失。本 skill 指导 Agent 读取 plan、按 frontmatter 中的 `todos` 落地实现，并在完成后回写 todo 状态。

与 `handoff-conversation` 分工：

| Skill                  | 场景                                                |
| ---------------------- | --------------------------------------------------- |
| `handoff-conversation` | 迁移对话中的决策、踩坑、半成品（plan 未记录的内容） |
| `execute-cursor-plan`  | 已有 plan 文件，按 todo 实现                        |

二者可组合：新对话 `@` plan + 粘贴 handoff 摘要。

## 前置条件

- Plan 路径：`.cursor/plans/*.plan.md`（或用户 `@` / 给出的绝对路径）
- 文件顶部 YAML 含 `todos[]`，每项有 `id`、`content`、`status`（`pending` / `in_progress` / `completed`）
- **使用 Agent 模式执行**；Plan 模式仅用于编写/修订计划，不直接改业务代码

## Agent 工作流

1. **定位 plan**
   - 优先读用户 `@` 的文件或给出的路径
   - 若无指定：`Glob` `.cursor/plans/*.md`，列出候选并请用户确认（多个时）

2. **解析状态**
   - 读取 frontmatter `todos`，按 `status` 分组列出
   - 若全部为 `completed`：告知用户，询问是验收、补测试/文档，还是新 scope（勿空转实现）

3. **执行前确认**（1–2 句）
   - 复述 plan 目标、起始 todo（第一个 `pending` 或用户指定的 `id`）、是否会更新 plan 内 todo 状态

4. **按 todo 实现**
   - 从第一个 `pending`（或用户指定 `id`）开始；开始时可将该项标为 `in_progress`
   - 严格遵循 plan 正文中的文件路径、架构约束与「不做」清单
   - 每完成一项：将 plan frontmatter 中对应 todo 的 `status` 改为 `completed`
   - 不扩大 scope；plan 外需求须单独确认

5. **验证**
   - 执行 plan 正文要求的命令（build、test 等）；失败则修复后再标 completed
   - 未改动 plan 范围外文件（除非用户明确允许）

## 何时叠加 handoff

以下情况先请用户使用 skill `handoff-conversation` 生成摘要，或粘贴已有摘要，再 `@` plan：

- 关键决策未写入 plan
- 存在未提交的局部改动或半成品
- 环境/工具链坑未在 plan 中记录

## 验收清单（Agent 自检）

- [ ] 目标 todo 均已 `completed`（或用户确认仅做子集）
- [ ] plan 列出的验证命令已通过
- [ ] 未越界修改 plan 范围外文件
- [ ] plan frontmatter 中的 todo 状态已同步

## 用户启动语模板

完整模板见 [prompt-templates.md](prompt-templates.md)。最短示例：

```text
请按 @.cursor/plans/<文件名>.plan.md 执行实现。
- Agent 模式，从 pending 的 todo 开始
- 每完成一项更新 plan 中对应 todo 的 status
- 跑 plan 中的验证；不要改 plan 范围外的文件
```

## 本仓库（Prompt extraction）

- Plan 目录：[`.cursor/plans/`](../../plans/)
- 示例：[`.cursor/plans/供应商识图模型标注_ca6a85dc.plan.md`](../../plans/供应商识图模型标注_ca6a85dc.plan.md)
- 相关 skill：同目录下 `open-plugin-ui-preview`、`libtv-cli`、`libtv-store-assets` 等；执行 plan 时若涉及 UI 预览、LibTV 商店素材，按 plan 正文交叉引用加载对应 skill

## 相关 skill

若缺少对话内决策上下文，先使用 `handoff-conversation` 生成可粘贴摘要，再在本流程中 `@` plan 文件。
