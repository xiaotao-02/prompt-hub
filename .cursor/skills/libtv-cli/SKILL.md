---
name: libtv-cli
description: LibTV 画布 CLI（lib-image-2）安装与登录。当需要 libtv project/node/upload/download 命令时使用。
---

# LibTV CLI 安装（Windows）

## 官方安装提示词

> 请帮我安装 LibTV CLI Skill：https://liblibai-web-static.liblib.cloud/cli/1.0.1/libtv-cli-skill.zip

## 安装步骤

1. 下载 ZIP（若 404，从 [liblib.tv](https://www.liblib.tv) 产品页或客服获取最新 CLI 包）。
2. 整目录替换 `%USERPROFILE%\.cursor\skills\libtv-cli\`，再执行 `LIBTV_CLI_VERSION=1.0.1 .\scripts\install-libtv-cli.ps1`（详见包内 `scripts/install.md`）。
3. 验证：`where libtv` → `libtv --version`（当前 1.0.1）
4. 登录：`libtv login web` → `libtv account info`（应返回 `user` 字段）

完整 CLI 文档见用户级 skill：`%USERPROFILE%\.cursor\skills\libtv-cli\SKILL.md`

## 与本仓库

商店素材生成：`npm run store:libtv`（见 `.cursor/skills/libtv-store-assets/SKILL.md`）。
