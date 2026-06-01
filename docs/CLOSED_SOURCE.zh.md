# 闭源仓库迁移清单（维护者）

本仓库为 **私有商业 monorepo**，不再以公开源码形式分发。下列步骤需在 GitHub 与生产环境一次性完成。

---

## 1. GitHub 仓库可见性

1. GitHub → **Settings → General → Danger Zone → Change repository visibility**
2. 选择 **Make private**
3. 建议同步检查：
   - **Settings → Actions → General**：限制 workflow 权限与 fork 行为
   - **Settings → Pages**：若曾启用 GitHub Pages，确认已关闭或改为私有部署
   - **Releases**：历史公开 Release 在私有化后对外不可见，但 fork/镜像可能仍保留旧 zip
   - **Forks**：公开期产生的 fork 不会自动删除，需评估是否联系删除或接受历史暴露

若仓库**曾经 Public**，应默认认为以下可能已被外部获取：

- 扩展 + `services/api` + `website` 全量源码
- 平台登录、计费、支付相关实现
- 运维文档与 CI 配置

---

## 2. 密钥与凭证轮换（建议）

| 类别                              | 建议动作                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------- |
| GitHub Actions Secrets（`CWS_*`） | 评估是否轮换 Chrome Web Store OAuth                                          |
| 平台 `JWT_SECRET`                 | 轮换后所有用户需重新登录                                                     |
| 上游模型 API Key（`UPSTREAM_*`）  | 在供应商控制台吊销并重建                                                     |
| 支付商户私钥（微信 / 支付宝）     | 若怀疑泄露则轮换                                                             |
| 其它 `.env` 生产变量              | 按 [OPEN_SOURCE_SECURITY.zh.md](OPEN_SOURCE_SECURITY.zh.md) 泄露应急流程处理 |

本地自检（应无真实密钥被 git 跟踪）：

```powershell
git ls-files | Select-String '\.env$|upstreams\.json|platform\.db'
```

---

## 3. 对外分发渠道

| 渠道                      | 闭源后定位                                |
| ------------------------- | ----------------------------------------- |
| Chrome Web Store          | **唯一**面向终端用户的正式更新渠道        |
| 官网 `github.com/xiaotao-02/prompt-hub` | 产品介绍、文档、账户与隐私政策            |
| GitHub Releases           | **已停用**（见移除的 `auto-release.yml`） |
| 源码 zip / 自建分发       | 不对外提供                                |

隐私政策 URL 应指向官网：<https://github.com/xiaotao-02/prompt-hub>，不再使用 `raw.githubusercontent.com`。

---

## 4. 后续插件开源仓（预留）

未来若从本仓抽离 **纯插件** 代码到新的公开仓库：

1. 在新仓重新定义 License（如 MIT）、README、PRIVACY（BYOK 版）
2. 仅导出扩展相关目录与白名单文件，**不要**同步 `services/api`、`website`、平台账户与支付逻辑
3. 可参考（内部参考，非日常发布路径）[`scripts/byok/`](../../scripts/byok/) 的裁剪思路，但需为新仓重写边界与 CI

当前私有主仓的日常发版见 [MAINTAINER.zh.md](MAINTAINER.zh.md) 与 [CHROME_WEB_STORE_CI.md](CHROME_WEB_STORE_CI.md)。
