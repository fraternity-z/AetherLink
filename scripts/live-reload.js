/**
 * Capacitor Live Reload 脚本
 * 列出所有网卡 IP，让用户选择
 */

import { readFileSync, writeFileSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const configPath = join(rootDir, 'capacitor.config.ts');

// 创建交互式输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 获取所有可用的 IPv4 地址
function getAllIPs() {
  const nets = networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 只获取 IPv4 地址，跳过内部地址
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({
          name,
          address: net.address
        });
      }
    }
  }
  
  return ips;
}

function selectIP() {
  return new Promise((resolve) => {
    const ips = getAllIPs();
    
    if (ips.length === 0) {
      rl.question('❌ 未找到网卡 IP，请手动输入 (如: 192.168.5.9): ', (ip) => {
        rl.close();
        resolve(ip.trim());
      });
      return;
    }
    
    console.log('\n🌐 检测到以下网卡 IP:\n');
    ips.forEach((ip, index) => {
      console.log(`  ${index + 1}. ${ip.address} (${ip.name})`);
    });
    
    rl.question('\n请选择网卡编号 (1-' + ips.length + '): ', (choice) => {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < ips.length) {
        rl.close();
        resolve(ips[index].address);
      } else {
        rl.close();
        console.log('❌ 无效选择');
        process.exit(1);
      }
    });
  });
}

async function main() {
  // 读取原始配置
  const originalConfig = readFileSync(configPath, 'utf-8');

  // 获取用户选择的 IP
  const localIP = await selectIP();
  const port = process.env.PORT || 5173;
  const serverUrl = `http://${localIP}:${port}`;

  console.log(`\n🔧 Live Reload 配置`);
  console.log(`   IP: ${localIP}`);
  console.log(`   端口: ${port}`);
  console.log(`   URL: ${serverUrl}\n`);

  // 修改配置，添加 url
  let modifiedConfig;
  if (originalConfig.includes("url: '")) {
    // 如果已存在 url，替换它
    modifiedConfig = originalConfig.replace(
      /url:\s*'[^']*'/,
      `url: '${serverUrl}'`
    );
  } else {
    // 如果不存在 url，在 server 对象开头添加
    modifiedConfig = originalConfig.replace(
      /server:\s*\{/,
      `server: {\n    url: '${serverUrl}',`
    );
  }

  writeFileSync(configPath, modifiedConfig, 'utf-8');
  console.log('✅ 已更新 capacitor.config.ts\n');

  // 同步到原生项目
  console.log('📱 同步配置到 Android...');
  execSync('npx cap copy android', { cwd: rootDir, stdio: 'inherit' });

  // 恢复原始配置
  function restore() {
    writeFileSync(configPath, originalConfig, 'utf-8');
    console.log('\n✅ 已恢复 capacitor.config.ts');
  }

  // 退出时恢复
  process.on('SIGINT', () => {
    restore();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    restore();
    process.exit(0);
  });

  console.log('\n🚀 启动开发服务器...');
  console.log('💡 提示: 在另一个终端运行 "npx cap run android" 启动应用\n');
  console.log('按 Ctrl+C 停止并恢复配置\n');

  // 启动 Vite 开发服务器
  const vite = spawn('npm', ['run', 'dev', '--', '--host'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  vite.on('close', () => {
    restore();
  });
}

main();
