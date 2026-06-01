import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import { BYOK_EXCLUDE_WORKFLOWS, BYOK_STRIP_SCRIPTS, OPEN_REPO_HOMEPAGE } from './config.js';
import { applyOverlayFiles, patchFile, writeDest } from './copyTree.js';

const RESOLVE_KEY_IMPORT = "import { resolveProviderApiKey } from './resolveProviderApiKey';";

export function applyAllByokPatches(destRoot: string, overlayRoot: string, srcRoot: string): void {
  applyOverlayFiles(srcRoot, destRoot, overlayRoot);

  patchFile(destRoot, 'src/lib/types/domain.ts', patchDomain);
  patchFile(destRoot, 'src/lib/providers.ts', patchProviders);
  patchFile(destRoot, 'src/lib/providerVisionCatalog.ts', patchProviderVisionCatalog);
  patchFile(destRoot, 'src/lib/quota/registry.ts', patchQuotaRegistry);
  patchFile(destRoot, 'src/lib/quota/fetch.ts', patchQuotaFetch);
  patchFile(destRoot, 'src/lib/api/extract.ts', patchExtract);
  patchFile(destRoot, 'src/lib/api/refine.ts', patchRefine);
  patchFile(destRoot, 'src/lib/api/models.ts', patchModelsImport);
  patchFile(destRoot, 'src/lib/providerRoles.ts', patchProviderRoles);
  patchFile(destRoot, 'src/lib/storage/keys.ts', patchStorageKeys);
  patchFile(destRoot, 'src/lib/storage/settings.ts', patchSettings);
  patchFile(destRoot, 'src/lib/types/messages.ts', patchMessagesTypes);
  patchFile(destRoot, 'src/background/messages.ts', patchBackgroundMessages);
  patchFile(destRoot, 'src/background/index.ts', patchBackgroundIndex);
  patchFile(destRoot, 'src/manifest.config.ts', patchManifest);
  patchFile(destRoot, 'src/options/settings/types.ts', patchSettingsTypes);
  patchFile(destRoot, 'src/options/settings/SettingsView.tsx', patchSettingsView);
  patchFile(
    destRoot,
    'src/options/settings/hooks/useProviderConnection.ts',
    patchUseProviderConnection,
  );
  patchFile(
    destRoot,
    'src/options/settings/tabs/ProviderSettingsPanel.tsx',
    patchProviderSettingsPanel,
  );
  patchFile(destRoot, 'src/options/OptionsApp.tsx', patchOptionsApp);
  patchFile(destRoot, 'src/options/ApiQuickSetup.tsx', patchApiQuickSetup);
  patchFile(destRoot, 'src/popup/PopupApp.tsx', patchPopupApp);
  patchFile(destRoot, 'src/popup/PopupApp.smoke.test.tsx', patchPopupSmokeTest);
  patchFile(destRoot, 'src/content/panel/quotaBadge.ts', patchQuotaBadge);
  patchFile(destRoot, 'vitest.config.ts', patchVitestConfig);
  patchFile(destRoot, 'src/lib/versionChipLabels.ts', (c) =>
    c.replace(/\n  platform: '平台',\n/, '\n'),
  );
  patchFile(destRoot, 'src/background/extraction.ts', stripUnusedClearQuotaCache);
  patchFile(destRoot, 'src/background/refine.ts', stripUnusedClearQuotaCache);
  patchFile(destRoot, 'src/lib/api/refine.provider.test.ts', (c) =>
    c
      .replace(/vi\.mock\('\.\.\/platform\/auth'/g, "vi.mock('../api/resolveProviderApiKey'")
      .replace(/\n\s*it\('uses platform[\s\S]*?\n\s*\}\);\n/g, '\n'),
  );

  patchPackageJson(destRoot);
  patchWorkflows(destRoot);
  patchProviderTests(destRoot);
  copyMigrateHelper(destRoot, srcRoot);
}

function patchDomain(c: string): string {
  return c.replace(/\n \* - 平台：platform[^\n]*\n/, '\n').replace(/\n  \| 'platform'\n/, '\n');
}

function patchProviders(c: string): string {
  return c
    .replace(
      /import \{ PLATFORM_API_URL, PLATFORM_SITE_URL \} from '\.\/platform\/config';\n\n/,
      '',
    )
    .replace(
      /\n  platform: \{[\s\S]*?\n  \},\n\n  \/\/ ============ 三大原生协议/,
      '\n\n  // ============ 三大原生协议',
    );
}

function patchProviderVisionCatalog(c: string): string {
  return c.replace(/\n  platform: \{[\s\S]*?\n  \},\n  openai:/, '\n  openai:');
}

function patchQuotaRegistry(c: string): string {
  return c
    .replace(/import \{ fetchPlatformQuota \} from '\.\/adapters\/platform';\n/, '')
    .replace(/\n  platform: fetchPlatformQuota,/, '');
}

function patchQuotaFetch(c: string): string {
  return c
    .replace(/import \{ getPlatformToken \} from '\.\.\/platform\/storage';\n/, '')
    .replace(
      /\n  if \(providerId === 'platform'\) \{\n    return getPlatformToken\(\);\n  \}\n/,
      '\n',
    );
}

function patchExtract(c: string): string {
  return c
    .replace(
      /import \{ resolveProviderApiKey \} from '\.\.\/platform\/auth';/,
      RESOLVE_KEY_IMPORT.replace('./resolveProviderApiKey', '../api/resolveProviderApiKey'),
    )
    .replace(/\n    case 'platform':\n/, '\n');
}

function patchRefine(c: string): string {
  return c.replace(/\n    case 'platform':\n/, '\n');
}

function patchModelsImport(c: string): string {
  return c.replace(
    /import \{ resolveProviderApiKey \} from '\.\.\/platform\/auth';/,
    RESOLVE_KEY_IMPORT.replace('./resolveProviderApiKey', '../api/resolveProviderApiKey'),
  );
}

function patchProviderRoles(c: string): string {
  return c
    .replace(
      /import \{ resolveProviderApiKey \} from '\.\/platform\/auth';/,
      "import { resolveProviderApiKey } from './api/resolveProviderApiKey';",
    )
    .replace(/\n  if \(providerId === 'platform'\) \{\n    return \{ ok: true \};\n  \}\n/, '\n')
    .replace(
      /\n  if \(providerId !== 'platform' && !base\.baseUrl\?\.trim\(\)\) \{/,
      '\n  if (!base.baseUrl?.trim()) {',
    );
}

function patchStorageKeys(c: string): string {
  return c.replace(
    /\n\/\*\* 平台代调用 API Token[^\n]*\*\/\nexport const PLATFORM_TOKEN_KEY[^\n]*\n/,
    '\n',
  );
}

function patchSettings(c: string): string {
  const importLine =
    "import { coerceByokProviderId } from '../../../scripts/byok/migrateSettings';\n";
  let out = c;
  if (!out.includes('coerceByokProviderId')) {
    out = out.replace(
      /import \{ DEFAULT_UPDATE_SETTINGS \} from '\.\.\/updater';/,
      `import { DEFAULT_UPDATE_SETTINGS } from '../updater';\n${importLine}`,
    );
  }
  out = out.replace(
    /  \/\/ platform 的 baseUrl[\s\S]*?  mergedProviders\.platform = \{[\s\S]*?  \};\n\n/,
    `  const validProviderIds = new Set(Object.keys(PROVIDERS));
  for (const id of Object.keys(mergedProviders) as ProviderId[]) {
    if (!validProviderIds.has(id)) {
      delete mergedProviders[id];
    }
  }

`,
  );
  out = out.replace(
    /  return \{\n    \.\.\.base,\n    \.\.\.\(stored \|\| \{\}\),\n    providers: mergedProviders,\n    updates: mergedUpdates,\n  \};/,
    `  const activeProvider = coerceByokProviderId(
    stored?.activeProvider,
    validProviderIds,
    base.activeProvider
  );
  const refineProviderRaw = stored?.refineProvider;
  const refineProvider =
    refineProviderRaw == null
      ? undefined
      : coerceByokProviderId(refineProviderRaw, validProviderIds, activeProvider);
  return {
    ...base,
    ...(stored || {}),
    activeProvider,
    refineProvider: refineProvider === activeProvider ? undefined : refineProvider,
    providers: mergedProviders,
    updates: mergedUpdates,
  };`,
  );
  return out;
}

function patchMessagesTypes(c: string): string {
  return c
    .replace(
      /\n  \| \{\n      \/\*\* popup \/ options → background：发送平台邮箱登录验证码 \*\/[\s\S]*?type: 'PLATFORM_LOGIN_GOOGLE';\n    \};/,
      '',
    )
    .replace(
      /\nexport interface PlatformLoginResponseOk[\s\S]*?export type PlatformLoginResponse[\s\S]*?;\n\n/,
      '\n',
    )
    .replace(/\n\/\*\* 官网 → 扩展[\s\S]*?export interface PeExtLoginResponse[\s\S]*?\}\n\n/, '\n');
}

function patchBackgroundMessages(c: string): string {
  return c
    .replace(/import \{ applyPlatformLogin \} from '@\/lib\/platform\/applyLogin';\n/, '')
    .replace(
      /import \{\n  emailCodeSend,\n  emailCodeVerify,\n  googleLoginWithIdentity,\n\} from '@\/lib\/platform\/authApi';\n/,
      '',
    )
    .replace(/  PlatformLoginResponse,\n/, '')
    .replace(
      /\n    if \(message\?\.type === 'PLATFORM_LOGIN_EMAIL_SEND'\) \{[\s\S]*?return true;\n    \}\n    if \(message\?\.type === 'PLATFORM_LOGIN_EMAIL_VERIFY'\) \{[\s\S]*?return true;\n    \}\n    if \(message\?\.type === 'PLATFORM_LOGIN_GOOGLE'\) \{[\s\S]*?return true;\n    \}\n/,
      '\n',
    );
}

function patchBackgroundIndex(c: string): string {
  return c
    .replace(/import \{ registerExternalAuthListener \} from '\.\/externalAuth';\n/, '')
    .replace(/\nregisterExternalAuthListener\(\);\n/, '\n');
}

function patchManifest(c: string): string {
  return c
    .replace(
      /  homepage_url: 'https:\/\/PromptHub\.com',/,
      `  homepage_url: '${OPEN_REPO_HOMEPAGE}',`,
    )
    .replace(
      /\n  permissions: \[\n    'contextMenus',\n    'storage',\n    'scripting',\n    'activeTab',\n    'clipboardWrite',\n    'identity',\n  \],/,
      `\n  permissions: [\n    'contextMenus',\n    'storage',\n    'scripting',\n    'activeTab',\n    'clipboardWrite',\n  ],`,
    )
    .replace(/\n  externally_connectable: \{[\s\S]*?\n  \},/, '');
}

function patchSettingsTypes(c: string): string {
  return c
    .replace(/\n  \| 'platformAccount'/, '')
    .replace(/\n    v === 'platformAccount' \|\|/, '')
    .replace(/\n  \{ id: 'platformAccount', label: '平台账户' \},/, '');
}

function patchSettingsView(c: string): string {
  return c
    .replace(/import PlatformAccountPanel from '\.\.\/PlatformAccountPanel';\n/, '')
    .replace(
      /\n  const \{ panelProps, onPlatformTokenChange \} = useProviderConnection\(/,
      '\n  const { panelProps } = useProviderConnection(',
    )
    .replace(/\n          \{panelId === 'platformAccount' && \([\s\S]*?\)\}\n\n/, '\n');
}

function patchUseProviderConnection(c: string): string {
  const nl = '\r?\n';
  let out = c.replace(/import \{ getPlatformToken \} from '@\/lib\/platform\/storage';\r?\n/, '');
  out = out.replace(
    new RegExp(
      `function providerAuthKey\\(pid: ProviderId, cfg: ProviderConfig, platformToken: string\\): string \\{${nl}  return pid === 'platform' \\? platformToken\\.trim\\(\\) : \\(cfg\\.apiKey \\?\\? ''\\)\\.trim\\(\\);${nl}\\}`,
      'g',
    ),
    `function providerAuthKey(_pid: ProviderId, cfg: ProviderConfig): string {
  return (cfg.apiKey ?? '').trim();
}`,
  );
  out = out.replace(
    new RegExp(
      `function providerAuthSig\\(pid: ProviderId, cfg: ProviderConfig, platformToken: string\\): string \\{${nl}  return \`\\$\\{providerAuthKey\\(pid, cfg, platformToken\\)\\}\\|\\$\\{cfg\\.baseUrl \\?\\? ''\\}\`;${nl}\\}`,
      'g',
    ),
    `function providerAuthSig(pid: ProviderId, cfg: ProviderConfig): string {
  return \`\${providerAuthKey(pid, cfg)}|\${cfg.baseUrl ?? ''}\`;
}`,
  );
  out = out.replace(
    new RegExp(
      `function hasProviderAuth\\(pid: ProviderId, cfg: ProviderConfig, platformToken: string\\): boolean \\{${nl}  const key = providerAuthKey\\(pid, cfg, platformToken\\);${nl}  const minLen = pid === 'platform' \\? 10 : 6;${nl}  return key\\.length >= minLen && Boolean\\(cfg\\.baseUrl\\?\\.trim\\(\\)\\);${nl}\\}`,
      'g',
    ),
    `function hasProviderAuth(_pid: ProviderId, cfg: ProviderConfig): boolean {
  const key = providerAuthKey(_pid, cfg);
  return key.length >= 6 && Boolean(cfg.baseUrl?.trim());
}`,
  );
  out = out.replace(/\s*const \[platformToken, setPlatformToken\] = useState\(''\);\r?\n/, '');
  out = out.replace(
    /providerAuthSig\(([^,)]+), ([^,)]+), platformToken\)/g,
    'providerAuthSig($1, $2)',
  );
  out = out.replace(
    /hasProviderAuth\(([^,)]+), ([^,)]+), platformToken\)/g,
    'hasProviderAuth($1, $2)',
  );
  out = out.replace(
    /\s*const onPlatformTokenChange = useCallback\([\s\S]*?\}, \[runFetchModels, settingsRef\]\);\r?\n\r?\n/,
    '\n',
  );
  out = out.replace(
    /\s*useEffect\(\(\) => \{\r?\n    void getPlatformToken\(\)\.then\(setPlatformToken\);\r?\n  \}, \[\]\);\r?\n\r?\n/,
    '\n',
  );
  out = out.replace(
    new RegExp(
      `const isEditingPlatform = editingProviderId === 'platform';${nl}    const hasApiKey = isEditingPlatform${nl}      \\? platformToken\\.trim\\(\\)\\.length >= 10${nl}      : Boolean\\(editingCfg\\.apiKey && editingCfg\\.apiKey\\.trim\\(\\)\\.length > 0\\);`,
      'g',
    ),
    'const hasApiKey = Boolean(editingCfg.apiKey && editingCfg.apiKey.trim().length > 0);',
  );
  out = out.replace(/\s*platformToken,\r?\n/g, '');
  out = out.replace(/\s*isEditingPlatform,\r?\n/g, '');
  out = out.replace(/\r?\n    onPlatformTokenChange,\r?\n/, '\n');
  out = out.replace(
    /\[persistAndMark, platformToken, providerRole/g,
    '[persistAndMark, providerRole',
  );
  out = out.replace(/\[panelId, platformToken, settings/g, '[panelId, settings');
  return out;
}

function patchProviderSettingsPanel(c: string): string {
  let out = c.replace(
    /\r?\n      \{providerRole === 'extract' &&\r?\n        settings\.activeProvider === 'platform' &&\r?\n        platformToken\.trim\(\)\.length < 10 && \([\s\S]*?\r?\n      \)\}\r?\n/,
    '\n',
  );
  out = out.replace(
    /\r?\n      \{providerRole === 'refine' &&\r?\n        resolveEffectiveRefineProvider\(settings\) === 'platform' &&\r?\n        platformToken\.trim\(\)\.length < 10 && \([\s\S]*?\r?\n      \)\}\r?\n/,
    '\n',
  );
  out = out.replace(/\s*platformToken,\r?\n/g, '');
  out = out.replace(/\s*isEditingPlatform,\r?\n/g, '');
  out = out.replace(
    /\{isEditingPlatform \? \([\s\S]*?\) : \(([\s\S]*?)\)\}\r?\n\r?\n        <ConnectionFieldColumn label="Base URL">/,
    '$1\n\n        <ConnectionFieldColumn label="Base URL">',
  );
  out = out.replace(/readOnly=\{isEditingPlatform\}/, 'readOnly={false}');
  out = out.replace(
    /\r?\n      \{\!isEditingPlatform && \(\r?\n        <ApiQuickSetup[\s\S]*?\r?\n      \)\}\r?\n/,
    (block) =>
      block
        .replace(/^\r?\n      \{\!isEditingPlatform && \(\r?\n/, '\n      ')
        .replace(/\r?\n      \)\}\r?\n$/, '\n'),
  );
  out = out.replace(/\r?\n        \{\!isEditingPlatform && hasApiKey/, '\n        {hasApiKey');
  out = out.replace(
    /\r?\n        \{isEditingPlatform && hasApiKey && discovered\.length === 0 && !fetchingModels && \([\s\S]*?\r?\n        \)\}\r?\n/,
    '\n',
  );
  out = out.replace(/, StatusBanner/, '');
  out = out.replace(
    /import \{ resolveEffectiveRefineProvider \} from '@\/lib\/providerRoles';\r?\n/,
    '',
  );
  out = out.replace(/\r?\n  onNavigatePanel,\r?\n/, '\n');
  return out;
}

function patchVitestConfig(c: string): string {
  let out = c.replace(
    "setupFiles: ['./src/test/setup.ts']",
    "setupFiles: [path.resolve(__dirname, 'src/test/setup.ts')]",
  );
  if (!/^\s*root:/m.test(out)) {
    out = out.replace(
      'export default defineConfig({',
      'export default defineConfig({\n  root: path.resolve(__dirname),',
    );
  }
  return out;
}

function patchQuotaBadge(c: string): string {
  return c
    .replace(
      /import \{ PROVIDER_QUOTA_CACHE_KEY, PLATFORM_TOKEN_KEY, SETTINGS_KEY \} from '@\/lib\/storage\/keys';/,
      "import { PROVIDER_QUOTA_CACHE_KEY, SETTINGS_KEY } from '@/lib/storage/keys';",
    )
    .replace(
      /\r?\n  chrome\.storage\.onChanged\.addListener\(\(changes, area\) => \{\r?\n    if \(area !== 'local' \|\| !\(PLATFORM_TOKEN_KEY in changes\)\) return;\r?\n    void refreshPanelQuotaBadge\(panel, true\);\r?\n  \}\);\r?\n/,
      '\n',
    );
}

function stripUnusedClearQuotaCache(c: string): string {
  let out = c.replace(
    /\r?\n    if \(result\.provider === 'platform'\) \{\r?\n      void clearQuotaCache\('platform'\);\r?\n    \}\r?\n/,
    '\n',
  );
  if (!/clearQuotaCache\(/.test(out)) {
    out = out.replace(/import \{ clearQuotaCache \} from '@\/lib\/quota\/cache';\r?\n/, '');
  }
  return out;
}

function patchOptionsApp(c: string): string {
  return c.replace(/import \{ PLATFORM_SITE_URL \} from '@\/lib\/platform\/config';\n/, '').replace(
    /<a[\s\S]*?href=\{PLATFORM_SITE_URL\}[\s\S]*?<\/a>\n/g,
    `<a
              href="${OPEN_REPO_HOMEPAGE}"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs text-violet-600 hover:underline inline-flex items-center gap-1 dark:text-violet-400"
              title="GitHub 开源仓库"
            >
              GitHub
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>\n`,
  );
}

function patchApiQuickSetup(c: string): string {
  return c.replace(
    /\n  const isPlatformRole = roleProviderId === 'platform';\n  const effectiveHasKey =\n    isPlatformRole && role === 'extract'\n      \? false\n      : Boolean\(activeCfg\?\.apiKey && activeCfg\.apiKey\.trim\(\)\.length > 0\);/,
    '\n  const effectiveHasKey = Boolean(activeCfg?.apiKey && activeCfg.apiKey.trim().length > 0);',
  );
}

function patchPopupApp(c: string): string {
  let out = c
    .replace(/import \{ PLATFORM_SITE_URL \} from '@\/lib\/platform\/config';\n/, '')
    .replace(/import \{ getPlatformLoginState \} from '@\/lib\/platform\/login';\n/, '')
    .replace(/import PlatformLoginForm from '@\/components\/PlatformLoginForm';\n/, '')
    .replace(
      /import \{ PLATFORM_TOKEN_KEY, SETTINGS_KEY \} from '@\/lib\/storage\/keys';/,
      "import { SETTINGS_KEY } from '@/lib/storage/keys';",
    )
    .replace(/\s*const \[platformLoggedIn, setPlatformLoggedIn\] = useState\(false\);\n/, '')
    .replace(
      /\s*void getPlatformLoginState\(\)\.then\(\(\{ loggedIn \}\) => setPlatformLoggedIn\(loggedIn\)\);\n/,
      '',
    )
    .replace(
      /\s*if \(area === 'local' && PLATFORM_TOKEN_KEY in changes\) \{\n        void getPlatformLoginState\(\)\.then\(\(\{ loggedIn \}\) => setPlatformLoggedIn\(loggedIn\)\);\n      \}\n/,
      '',
    )
    .replace(
      /\n          \{platformLoggedIn \? \([\s\S]*?\) : null\}\n/,
      '\n          <ProviderQuotaBadge providerId={activeProviderId} compact className="mr-0.5" />\n',
    )
    .replace(
      /\n          <a[\s\S]*?href=\{PLATFORM_SITE_URL\}[\s\S]*?<\/a>\n/,
      `\n          <a
            href="${OPEN_REPO_HOMEPAGE}"
            target="_blank"
            rel="noreferrer"
            title="GitHub 开源仓库"
            aria-label="GitHub 开源仓库"
            className="inline-flex shrink-0 items-center justify-center gap-1 h-7 px-2 text-[11px] rounded-lg border font-medium transition border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            GitHub
            <ExternalLink className="w-3 h-3 opacity-90" aria-hidden />
          </a>\n`,
    )
    .replace(/\n      \{\!platformLoggedIn && \([\s\S]*?\)\}\n\n/, '\n');
  return out;
}

function patchPopupSmokeTest(c: string): string {
  return c.replace(/\nvi\.mock\('@\/lib\/platform\/login'[\s\S]*?\}\)\);\n/, '\n');
}

function patchPackageJson(destRoot: string): void {
  const pkgPath = pathJoin(destRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    scripts?: Record<string, string>;
    private?: boolean;
  };
  for (const key of BYOK_STRIP_SCRIPTS) {
    delete pkg.scripts?.[key];
  }
  pkg.private = false;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
}

function patchWorkflows(destRoot: string): void {
  const wfDir = pathJoin(destRoot, '.github/workflows');
  if (!existsSync(wfDir)) return;
  for (const name of readdirSync(wfDir)) {
    if (BYOK_EXCLUDE_WORKFLOWS.has(name)) {
      rmSync(pathJoin(wfDir, name), { force: true });
    }
  }
}

function patchProviderTests(destRoot: string): void {
  patchFile(destRoot, 'src/lib/providerRoles.test.ts', (c) =>
    c.replace(
      /vi\.mock\('\.\/platform\/auth'[\s\S]*?\}\)\);\r?\n/,
      `vi.mock('./api/resolveProviderApiKey', () => ({
  resolveProviderApiKey: vi.fn(async (_pid: ProviderId, cfg: { apiKey: string }) => cfg.apiKey),
}));\n`,
    ),
  );
  patchFile(destRoot, 'src/lib/quota/quota.test.ts', (c) =>
    c
      .replace(/import \{ fetchPlatformQuota \} from '\.\/adapters\/platform';\r?\n/, '')
      .replace(/\r?\n\s*it\('platform[\s\S]*?\r?\n\s*\}\);\r?\n/g, '\n'),
  );
}

export function copyMigrateHelper(destRoot: string, srcRoot: string): void {
  writeDest(
    destRoot,
    'scripts/byok/migrateSettings.ts',
    readFileSync(pathJoin(srcRoot, 'scripts/byok/migrateSettings.ts'), 'utf-8'),
  );
  writeDest(
    destRoot,
    'scripts/byok/migrateSettings.test.ts',
    readFileSync(pathJoin(srcRoot, 'scripts/byok/migrateSettings.test.ts'), 'utf-8'),
  );
}
