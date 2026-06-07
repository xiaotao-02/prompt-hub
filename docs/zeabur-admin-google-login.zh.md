# Zeabur 管理员后台登录（Google 方式）

> 无独立「管理员账号/密码」。管理员 = 普通用户 JWT + 登录邮箱在 `ADMIN_EMAILS` 白名单。详见 [admin-dashboard.zh.md](admin-dashboard.zh.md)。

## 前置

- 已完成 [deploy-zeabur-runbook.zh.md](deploy-zeabur-runbook.zh.md) 步骤 1–5（**两个** Zeabur 服务：`website` 与 `api`，记下 `<WEB>` / `<API>` 域名）。
- 若只有一个服务且访问 `https://xxx.zeabur.app` 为 **404**：先把该服务 Root Directory 设为 `website` 并 Redeploy，再新建 `api` 服务（见 runbook 常见问题「全站 404」）。**未跑通官网前不要配 Google 后台。**
- 准备一个 **Google 账号** 作为管理员（该邮箱将写入 `ADMIN_EMAILS`）。

---

## 步骤 1：Google Cloud OAuth 客户端

1. 打开 [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)。
2. 若无 OAuth 同意屏幕：配置 **OAuth consent screen** → User type **External** → 填应用名与支持邮箱；Testing 阶段把管理员 Google 邮箱加入 **Test users**。
3. **Create Credentials** → **OAuth client ID** → Application type **Web application**。
4. **Authorized JavaScript origins** 添加（无路径、无尾斜杠）：
   - `https://<WEB>.zeabur.app`
5. 复制 **Client ID**（`xxxx.apps.googleusercontent.com`）。  
   使用 Google Identity Services 按钮登录，**无需**配置 Redirect URI。

---

## 步骤 2：Zeabur 环境变量

将 `<CLIENT_ID>`、`<你的管理员邮箱>`、`<WEB>`、`<API>` 替换为实际值。

### API 服务 → 变量

```env
GOOGLE_CLIENT_ID=<CLIENT_ID>
ADMIN_EMAILS=<你的管理员邮箱>
```

`ADMIN_EMAILS` 须与 Google 返回邮箱**完全一致**（建议小写）；多人用英文逗号分隔。

### website 服务 → 变量

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<CLIENT_ID>
```

须与 API 的 `GOOGLE_CLIENT_ID` **相同**。

---

## 步骤 3：重新部署

修改 Zeabur 变量**不会**自动部署：

- API 服务 → **Redeploy Service**
- website 服务 → **Redeploy Service**

`ADMIN_EMAILS` 仅在 API 启动时读取；改白名单后必须 Redeploy API。

---

## 步骤 4：登录并进后台

1. 打开 `https://<WEB>.zeabur.app/account`，点击 Google 登录，使用白名单邮箱。
2. 访问 `https://<WEB>.zeabur.app/admin`。
3. 若显示「无管理员权限」，点「重新验证」（JWT 仍有效时无需重登）。

---

## 命令行验收（可选）

仓库根目录：

```powershell
.\scripts\verify-zeabur-admin.ps1 -ApiUrl "https://<API>.zeabur.app" -WebUrl "https://<WEB>.zeabur.app"
```

登录拿到 JWT 后验证后台：

```powershell
.\scripts\verify-zeabur-admin.ps1 -ApiUrl "https://<API>.zeabur.app" -Token "<Bearer JWT>"
```

---

## 常见问题

| 现象                               | 处理                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| 账户页无 Google 按钮               | 检查 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 与 website Redeploy                                        |
| 有 Google 按钮但登录失败 / API 503 | website 已配 Client ID 但 API 未设 `GOOGLE_CLIENT_ID`；两端须相同并 Redeploy API               |
| Google 弹窗 origin 错误            | origins 须精确为 `https://<WEB>.zeabur.app`                                                    |
| 登录成功但 /admin 403              | `ADMIN_EMAILS` 拼写不符或未 Redeploy API                                                       |
| Testing 同意屏幕                   | 未加入 Test users 的账号无法登录                                                               |
| 切自定义域名                       | Google origins 追加新域名；更新 `SITE_URL` / `NEXT_PUBLIC_*` / `CORS_ORIGIN` 后双服务 Redeploy |

## 备选（未配 Google 时）

- **邮箱**：API 配置 `SMTP_*` 或 `ZSEND_API_KEY`（见 [services/api/src/mail.ts](../services/api/src/mail.ts)、[deploy-zeabur-runbook.zh.md](deploy-zeabur-runbook.zh.md) 5.1.1）。一键写入：`.\scripts\apply-zeabur-smtp.ps1`
- **临时**：`EMAIL_DEV_LOG=true`，从 Zeabur API 日志复制魔法链接/验证码（勿长期用于生产）。
