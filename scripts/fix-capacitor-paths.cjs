const fs = require('fs');
const path = require('path');

const mappings = [
  { from: 'aetherlink-capacitor-core', to: '@capacitor/core' },
  { from: 'aetherlink-capacitor-android', to: '@capacitor/android' },
  { from: 'aetherlink-capacitor-ios', to: '@capacitor/ios' },
  { from: 'aetherlink-capacitor-cli', to: '@capacitor/cli' }
];

const nodeModulesPath = path.resolve(__dirname, '../node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('node_modules does not exist, skipping fix.');
  process.exit(0);
}

mappings.forEach(({ from, to }) => {
  const sourcePath = path.join(nodeModulesPath, from);
  const targetPath = path.join(nodeModulesPath, to);
  const targetDir = path.dirname(targetPath);

  if (fs.existsSync(sourcePath)) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (!fs.existsSync(targetPath)) {
      try {
        // 尝试创建符号链接
        // 'junction' 类型在 Windows 上不需要管理员权限
        fs.symlinkSync(sourcePath, targetPath, 'junction');
        console.log(`Linked ${from} -> ${to}`);
      } catch (e) {
        console.warn(`Failed to link ${from} -> ${to}:`, e.message);
        // 如果符号链接失败（例如权限问题），尝试复制（作为回退）
        try {
            console.log(`Falling back to copying ${from} -> ${to}...`);
            fs.cpSync(sourcePath, targetPath, { recursive: true });
            console.log(`Copied ${from} -> ${to}`);
        } catch (copyError) {
            console.error(`Failed to copy ${from} -> ${to}:`, copyError.message);
        }
      }
    } else {
      console.log(`${to} already exists.`);
    }
  } else {
    // console.warn(`Source package ${from} not found in node_modules.`);
  }
});