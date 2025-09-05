/**
 * DNS管理器 - 一劳永逸解决DNS问题
 *
 * 功能：
 * 1. 应用启动时强制设置可靠的DNS服务器
 * 2. 健康检查和自动故障恢复
 * 3. 多DNS服务器故障转移
 * 4. 智能缓存和重试机制
 */
import dns from 'dns';
import { promisify } from 'util';
const resolve4 = promisify(dns.resolve4);
// 可靠的公共DNS服务器（按优先级排序）
const RELIABLE_DNS_SERVERS = [
    '8.8.8.8', // Google Primary
    '8.8.4.4', // Google Secondary  
    '1.1.1.1', // Cloudflare Primary
    '1.0.0.1', // Cloudflare Secondary
    '208.67.222.222', // OpenDNS Primary
    '208.67.220.220', // OpenDNS Secondary
];
// 关键域名列表（用于健康检查）
const CRITICAL_DOMAINS = [
    'ewwewswxjyuxfbwzdirx.supabase.co',
    'google.com',
    'cloudflare.com'
];
class DNSManager {
    constructor() {
        this.currentServers = [];
        this.isInitialized = false;
        this.healthCheckInterval = null;
        this.lastHealthCheck = 0;
        this.HEALTH_CHECK_INTERVAL = 60000; // 1分钟检查一次
    }
    /**
     * 初始化DNS管理器 - 应用启动时调用
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('🔧 DNS管理器已初始化');
            return;
        }
        console.log('🚀 正在初始化DNS管理器...');
        // 1. 强制设置可靠的DNS服务器
        await this.setReliableDNS();
        // 2. 验证DNS配置
        await this.verifyDNSHealth();
        // 3. 启动健康监控
        this.startHealthMonitoring();
        this.isInitialized = true;
        console.log('✅ DNS管理器初始化完成');
    }
    /**
     * 设置可靠的DNS服务器
     */
    async setReliableDNS() {
        const originalServers = dns.getServers();
        console.log('📍 当前DNS服务器:', originalServers);
        // 测试并选择最快的DNS服务器
        const fastestServers = await this.findFastestDNSServers();
        dns.setServers(fastestServers);
        this.currentServers = fastestServers;
        console.log('🔄 已更新DNS服务器:', fastestServers);
    }
    /**
     * 测试并找出最快的DNS服务器
     */
    async findFastestDNSServers() {
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
            }
            catch (error) {
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
    async verifyDNSHealth() {
        console.log('🔍 验证DNS健康状态...');
        const results = await Promise.allSettled(CRITICAL_DOMAINS.map(async (domain) => {
            const startTime = Date.now();
            const addresses = await resolve4(domain);
            const responseTime = Date.now() - startTime;
            console.log(`  ${domain}: ${addresses.join(', ')} (${responseTime}ms) ✅`);
            return { domain, addresses, responseTime };
        }));
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const healthRatio = successCount / CRITICAL_DOMAINS.length;
        console.log(`📊 DNS健康度: ${(healthRatio * 100).toFixed(1)}% (${successCount}/${CRITICAL_DOMAINS.length})`);
        if (healthRatio < 0.8) {
            console.log('⚠️ DNS健康度较低，尝试重新配置...');
            await this.setReliableDNS();
            return false;
        }
        this.lastHealthCheck = Date.now();
        return true;
    }
    /**
     * 启动健康监控
     */
    startHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.verifyDNSHealth();
            }
            catch (error) {
                console.error('❌ DNS健康检查失败:', error);
                // 尝试重新初始化
                await this.setReliableDNS();
            }
        }, this.HEALTH_CHECK_INTERVAL);
        console.log('👁️ DNS健康监控已启动');
    }
    /**
     * 解析特定域名（带重试机制）
     */
    async resolveDomain(domain, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const addresses = await resolve4(domain);
                return addresses;
            }
            catch (error) {
                console.log(`❌ 解析 ${domain} 失败 (第${attempt}次尝试): ${error.code}`);
                if (attempt === maxRetries) {
                    // 最后一次尝试失败，重新配置DNS
                    console.log('🔄 重新配置DNS服务器...');
                    await this.setReliableDNS();
                    throw error;
                }
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        throw new Error(`无法解析域名: ${domain}`);
    }
    /**
     * 获取当前DNS状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentServers: this.currentServers,
            lastHealthCheck: this.lastHealthCheck,
            healthCheckAge: Date.now() - this.lastHealthCheck
        };
    }
    /**
     * 清理资源
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        console.log('🛑 DNS管理器已停止');
    }
}
// 单例实例
export const dnsManager = new DNSManager();
/**
 * 应用启动时调用的初始化函数
 */
export async function initializeDNS() {
    await dnsManager.initialize();
}
/**
 * 安全的域名解析函数
 */
export async function safeDNSResolve(domain) {
    if (!dnsManager.getStatus().isInitialized) {
        await dnsManager.initialize();
    }
    return dnsManager.resolveDomain(domain);
}
/**
 * 获取DNS健康状态
 */
export function getDNSStatus() {
    return dnsManager.getStatus();
}
