# 自定义域名 aipromptstudio.top

## 域名分工

| 用途     | 域名                             |
| -------- | -------------------------------- |
| 官网     | `https://aipromptstudio.top`     |
| 平台 API | `https://api.aipromptstudio.top` |

Zeabur 环境变量片段：[`output/zeabur-api-domain.env`](../output/zeabur-api-domain.env)、[`output/zeabur-website-domain.env`](../output/zeabur-website-domain.env)。

## 操作顺序

1. **Zeabur 绑定域名**（先绑再解析，控制台会显示 DNS 目标）
   - `website` 服务 → 域名 → 自定义域名 → `aipromptstudio.top`
   - `api` 服务 → 域名 → 自定义域名 → `api.aipromptstudio.top`
2. **域名注册商 DNS**（按 Zeabur 控制台给出的记录填写，以下为常见形态）
   - `@` → website 的 CNAME 或 A（根域若不支持 CNAME 则按 Zeabur 文档转 A）
   - `api` → api 服务的 CNAME
3. **更新环境变量并 Redeploy**（见 [`deploy-platform.zh.md`](deploy-platform.zh.md)）
4. **扩展商店包**：`npm run release:store`（已默认注入 `VITE_PLATFORM_*`）

## 一键脚本（需 Zeabur API Key）

```powershell
$env:ZEABUR_TOKEN = '<API Key>'
.\scripts\apply-zeabur-production-domain.ps1
```

无 Token 时脚本仍会打印 DNS 说明并合并本地 `output/zeabur-api.env` / `zeabur-website.env`。

## 验收

```powershell
.\scripts\verify-zeabur-deploy.ps1 `
  -WebUrl https://aipromptstudio.top `
  -ApiUrl https://api.aipromptstudio.top
```

DNS 未生效前会失败，属正常现象；待解析生效后再跑。

## Google OAuth

在 Google Cloud Console 的 OAuth Web 客户端 **Authorized JavaScript origins** 增加：

- `https://aipromptstudio.top`
