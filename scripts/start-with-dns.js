#!/usr/bin/env node
/**
 * 带DNS初始化的启动脚本
 * 这个脚本会：
 * 1. 先初始化DNS配置
 * 2. 再启动Next.js开发服务器
 * 3. 确保DNS问题一劳永逸解决
 */

const { spawn } = require('child_process');
const path = require('path');

// 初始化DNS配置
async function initializeDNS() {
  console.log('🔧 正在初始化DNS配置...\n');
  
  // 动态导入ES模块
  const { initializeApp, setupGracefulShutdown } = await import('../lib/app-initializer.js');
  
  try {
    await initializeApp();
    setupGracefulShutdown();
    console.log('✅ DNS初始化完成，启动Next.js服务器...\n');
  } catch (error) {
    console.error('❌ DNS初始化失败:', error);
    console.log('⚠️ 继续启动服务器（降级模式）...\n');
  }
}

// 启动Next.js开发服务器
function startNextServer() {
  const nextCommand = process.argv.includes('--build') ? 'build' : 'dev';
  const port = process.argv.includes('--port') ? 
    process.argv[process.argv.indexOf('--port') + 1] : '3000';
  
  console.log(`🚀 启动Next.js服务器 (${nextCommand}模式，端口${port})...\n`);
  
  const args = [nextCommand];
  if (nextCommand === 'dev') {
    args.push('--port', port);
  }
  
  const nextProcess = spawn('npx', ['next', ...args], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env }
  });
  
  nextProcess.on('error', (error) => {
    console.error('❌ Next.js启动失败:', error);
    process.exit(1);
  });
  
  nextProcess.on('close', (code) => {
    console.log(`\n🛑 Next.js服务器已停止 (退出码: ${code})`);
    process.exit(code);
  });
  
  // 优雅关闭处理
  process.on('SIGTERM', () => nextProcess.kill('SIGTERM'));
  process.on('SIGINT', () => nextProcess.kill('SIGINT'));
}

// 主函数
async function main() {
  console.log('🧠 AI Brain - 智能启动脚本');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // 1. 初始化DNS
    await initializeDNS();
    
    // 2. 启动Next.js
    startNextServer();
    
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);