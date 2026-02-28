#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');
const OUTPUT_DIR = path.join(ROOT, 'artifacts');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'perf-baseline.json');
const CHAT_SCOPE_TARGETS = [
  path.join(SRC_DIR, 'components', 'message'),
  path.join(SRC_DIR, 'components', 'chat'),
  path.join(SRC_DIR, 'solid', 'components', 'MessageList'),
  path.join(SRC_DIR, 'pages', 'ChatPage', 'components', 'ChatPageUI.tsx'),
  path.join(SRC_DIR, 'shared', 'hooks', 'useAppSettingsStore.ts'),
  path.join(SRC_DIR, 'shared', 'hooks', 'useGlobalPointerSubscription.ts')
];

const KB = 1024;
const TOP_JS_LIMIT = 12;

const walkFiles = (dir, predicate = () => true) => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, predicate));
      continue;
    }

    if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
};

const sizeReport = (files) => {
  const details = files.map((filePath) => {
    const stat = fs.statSync(filePath);
    return {
      file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
      bytes: stat.size,
      kb: Number((stat.size / KB).toFixed(2))
    };
  });

  const totalBytes = details.reduce((sum, file) => sum + file.bytes, 0);

  return {
    totalBytes,
    totalKB: Number((totalBytes / KB).toFixed(2)),
    files: details
  };
};

const countPattern = (files, pattern) => {
  let count = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }

  return count;
};

const getSourceFiles = () => walkFiles(
  SRC_DIR,
  (filePath) => /\.(ts|tsx|js|jsx)$/.test(filePath)
);

const getChatScopeFiles = () => {
  const files = [];

  for (const targetPath of CHAT_SCOPE_TARGETS) {
    if (!fs.existsSync(targetPath)) {
      continue;
    }

    const stat = fs.statSync(targetPath);
    if (stat.isFile()) {
      if (/\.(ts|tsx|js|jsx)$/.test(targetPath)) {
        files.push(targetPath);
      }
      continue;
    }

    files.push(...walkFiles(targetPath, filePath => /\.(ts|tsx|js|jsx)$/.test(filePath)));
  }

  return files;
};

const collectStaticMetrics = (files) => {
  return {
    messageListGetElementById: countPattern(files, /getElementById\((['"])messageList\1\)/g),
    mutationObserver: countPattern(files, /MutationObserver\(/g),
    settingsListeners: countPattern(files, /addEventListener\((['"])(?:storage|appSettingsChanged|settingsChanged)\1/g),
    pointerListeners: countPattern(files, /addEventListener\((['"])(?:mousemove|touchstart|touchmove|touchend)\1/g)
  };
};

const main = () => {
  const jsFiles = walkFiles(path.join(DIST_DIR, 'static', 'js'), file => file.endsWith('.js'));
  const cssFiles = walkFiles(path.join(DIST_DIR, 'static', 'css'), file => file.endsWith('.css'));
  const fontFiles = walkFiles(path.join(DIST_DIR, 'static'), file => /\.(woff2?|ttf|otf)$/.test(file));
  const srcFiles = getSourceFiles();
  const chatScopeFiles = getChatScopeFiles();

  const jsReport = sizeReport(jsFiles);
  const cssReport = sizeReport(cssFiles);
  const fontReport = sizeReport(fontFiles);

  const topJsChunks = [...jsReport.files]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, TOP_JS_LIMIT);

  const staticMetrics = collectStaticMetrics(chatScopeFiles);
  const globalStaticMetrics = collectStaticMetrics(srcFiles);

  const baseline = {
    generatedAt: new Date().toISOString(),
    totals: {
      totalJSKB: jsReport.totalKB,
      totalCSSKB: cssReport.totalKB,
      totalFontKB: fontReport.totalKB
    },
    topJsChunks,
    staticMetrics,
    globalStaticMetrics
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(baseline, null, 2));

  console.log(`TOTAL_JS_KB=${baseline.totals.totalJSKB}`);
  console.log(`TOTAL_CSS_KB=${baseline.totals.totalCSSKB}`);
  console.log(`TOTAL_FONT_KB=${baseline.totals.totalFontKB}`);
  console.log('TOP_JS_CHUNKS');
  for (const chunk of topJsChunks) {
    console.log(`${chunk.file}\t${chunk.kb} KB`);
  }
  console.log('STATIC_METRICS_CHAT_SCOPE');
  console.log(JSON.stringify(staticMetrics, null, 2));
  console.log('STATIC_METRICS_GLOBAL');
  console.log(JSON.stringify(globalStaticMetrics, null, 2));
  console.log(`BASELINE_FILE=${path.relative(ROOT, OUTPUT_FILE).replace(/\\/g, '/')}`);
};

main();
