# 新对话启动语模板

复制以下任一段到新对话（Agent 模式），并将 `<文件名>` 换成实际 plan 路径。

---

## 1. 全量执行（从 pending 开始）

```text
请按 @.cursor/plans/<文件名>.plan.md 执行实现。
- 使用 Agent 模式，从 status 为 pending 的 todo 开始
- 每完成一项，更新 plan frontmatter 中对应 todo 的 status
- 跑 plan 中的验证步骤；不要改 plan 范围外的文件
```

---

## 2. 断点续做（指定已完成项）

```text
请按 @.cursor/plans/<文件名>.plan.md 继续实现。
- 已完成 todo：<id-1>、<id-2>
- 从 todo <下一个-id> 开始
- 每完成一项更新 plan 中 todo status
```

---

## 3. Plan 已全部 completed（验收 / 小修）

```text
@.cursor/plans/<文件名>.plan.md 中所有 todo 已是 completed。
请按 plan 正文做验收：<例如 build + 相关测试>。
仅修改 plan 中列出的文件；若有缺口请列出，不要擅自扩大 scope。
```

---

## 4. Plan + Handoff 组合

```text
以下为上一对话的 handoff 摘要：

<paste handoff here>

请结合上述上下文，按 @.cursor/plans/<文件名>.plan.md 从 pending todo 开始执行。
```

---

## English (optional)

```text
Execute @.cursor/plans/<filename>.plan.md in Agent mode.
Start from the first pending todo; update each todo status in the plan frontmatter when done.
Run verification steps listed in the plan; do not edit files outside the plan scope.
```
