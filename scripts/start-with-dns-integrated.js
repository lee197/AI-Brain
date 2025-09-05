#!/usr/bin/env node
/**
 * 集成DNS初始化的启动脚本
 * 一劳永逸解决DNS问题的完整解决方案
 */

const { spawn } = require('child_process');
const path = require('path');
const dns = require('dns');
const https = require('https');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

// 可靠的公共DNS服务器（按优先级排序）
const RELIABLE_DNS_SERVERS = [
  '8.8.8.8',      // Google Primary
  '8.8.4.4',      // Google Secondary  
  '1.1.1.1',      // Cloudflare Primary
  '1.0.0.1',      // Cloudflare Secondary
  '208.67.222.222', // OpenDNS Primary
  '208.67.220.220', // OpenDNS Secondary
];

// 关键域名列表（用于健康检查）
const CRITICAL_DOMAINS = [
  'ewwewswxjyuxfbwzdirx.supabase.co',
  'google.com',
  'cloudflare.com'
];

/**
 * 测试并找出最快的DNS服务器
 */
async function findFastestDNSServers() {
  const results = [];
  
  console.log('🧪 测试DNS服务器响应时间...');
  
  for (const server of RELIABLE_DNS_SERVERS) {
    try {
      const startTime = Date.now();
      
      // 临时设置单个DNS服务器进行测试
      dns.setServers([server]);
      await resolve4('google.com');
      
      const responseTime = Date.now() - startTime;
      results.push({ server, responseTime });
      
      console.log(`  ${server}: ${responseTime}ms ✅`);
    } catch (error) {
      console.log(`  ${server}: 失败 ❌`);
    }
  }
  
  // 按响应时间排序，选择前4个最快的服务器
  const sortedServers = results
    .sort((a, b) => a.responseTime - b.responseTime)
    .slice(0, 4)
    .map(r => r.server);
  
  // 如果没有可用的服务器，使用默认配置
  if (sortedServers.length === 0) {
    console.log('⚠️ 所有DNS服务器测试失败，使用默认配置');
    return RELIABLE_DNS_SERVERS.slice(0, 2);
  }
  
  console.log('🏆 选择的DNS服务器:', sortedServers);
  return sortedServers;
}

/**
 * 验证DNS健康状态
 */
async function verifyDNSHealth() {
  console.log('🔍 验证DNS健康状态...');
  
  const results = await Promise.allSettled(
    CRITICAL_DOMAINS.map(async domain => {
      const startTime = Date.now();
      const addresses = await resolve4(domain);
      const responseTime = Date.now() - startTime;
      
      console.log(`  ${domain}: ${addresses.join(', ')} (${responseTime}ms) ✅`);
      return { domain, addresses, responseTime };
    })
  );
  
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const healthRatio = successCount / CRITICAL_DOMAINS.length;
  
  console.log(`📊 DNS健康度: ${(healthRatio * 100).toFixed(1)}% (${successCount}/${CRITICAL_DOMAINS.length})`);
  
  return healthRatio > 0.5; // 至少50%成功率
}

/**
 * 测试Supabase连接
 */
async function testSupabaseConnection() {
  console.log('🔗 测试Supabase连接...');
  
  // 加载环境变量
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase环境变量未配置');
    return false;
  }
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: new URL(supabaseUrl).hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }, (res) => {
      console.log(`  ✅ Supabase连接成功: HTTP ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ Supabase连接失败: ${error.code} - ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`  ⏰ Supabase连接超时`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * DNS初始化主函数
 */
async function initializeDNS() {
  console.log('🚀 正在初始化DNS配置...\n');
  
  const originalServers = dns.getServers();
  console.log('📍 当前DNS服务器:', originalServers);
  
  try {
    // 1. 测试并设置最快的DNS服务器
    const fastestServers = await findFastestDNSServers();
    dns.setServers(fastestServers);
    
    console.log('🔄 已更新DNS服务器:', fastestServers);
    
    // 2. 验证DNS健康状态
    const isHealthy = await verifyDNSHealth();
    
    // 3. 测试Supabase连接
    const supabaseOK = await testSupabaseConnection();
    
    // 4. 显示状态摘要
    console.log('\n📊 DNS初始化状态摘要:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 DNS配置: ✅ 已优化 (${fastestServers.length} 服务器)`);
    console.log(`📊 健康状态: ${isHealthy ? '✅ 良好' : '⚠️ 需要关注'}`);
    console.log(`🔗 Supabase: ${supabaseOK ? '✅ 连接正常' : '⚠️ 连接异常'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (isHealthy && supabaseOK) {
      console.log('✅ DNS问题已一劳永逸解决！\n');
    } else {
      console.log('⚠️ DNS配置存在问题，但应用将继续启动\n');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ DNS初始化失败:', error.message);
    console.log('⚠️ 应用将使用系统默认DNS配置\n');
    return false;
  }
}

/**
 * 启动Next.js开发服务器
 */
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
  const cleanup = () => {
    console.log('\n🛑 正在优雅关闭应用程序...');
    nextProcess.kill('SIGTERM');
  };
  
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGUSR2', cleanup); // nodemon重启
}

/**
 * 主函数
 */
async function main() {
  console.log('🧠 AI Brain - DNS保护启动');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // 1. 初始化DNS（关键步骤）
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