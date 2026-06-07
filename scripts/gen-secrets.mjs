#!/usr/bin/env node
/**
 * 生成生产环境密钥，可直接粘贴到 Zeabur / VPS 环境变量。
 * 用法：npm run gen:secrets
 */
import { randomBytes } from 'node:crypto';

function secret() {
  return randomBytes(32).toString('hex');
}

const jwt = secret();
const authLink = secret();
const configEnc = secret();

console.log('# 复制以下三行到 Zeabur API 服务「变量」或生产 .env（勿提交 git）\n');
console.log(`JWT_SECRET=${jwt}`);
console.log(`AUTH_LINK_SECRET=${authLink}`);
console.log(`CONFIG_ENCRYPTION_KEY=${configEnc}`);
console.log(
  '\n# 生产还须确认：DEV_LOGIN_ENABLED=false、MOCK_PAY_ENABLED=false、EMAIL_DEV_LOG=false',
);
