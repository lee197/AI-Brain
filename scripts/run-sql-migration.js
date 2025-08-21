const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const SUPABASE_URL = 'https://ewwewswxjyuxfbwzdirx.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2V3c3d4anl1eGZid3pkaXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ4NzQ5OCwiZXhwIjoyMDcxMDYzNDk4fQ.7-a6FTsg_u8Kxd2nrZXmPlbzhdiQmtBd-744qK3SZ2E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 执行SQL迁移脚本
 */
async function runSqlMigration() {
  console.log('📂 运行SQL迁移脚本...')
  
  try {
    // 读取SQL文件
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/20240820_slack_tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 SQL文件读取成功，大小:', sqlContent.length, '字符')
    
    // 分割SQL语句（简单分割，按分号分割）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log('📝 找到', statements.length, '条SQL语句')
    
    let successCount = 0
    let errorCount = 0
    
    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';' // 重新添加分号
      
      // 跳过注释和空语句
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }
      
      try {
        console.log(`⚡ 执行语句 ${i + 1}/${statements.length}...`)
        
        // 使用原生SQL执行
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // 忽略一些常见的非关键性错误
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⚠️ 跳过已存在的对象 (${i + 1}):`, error.message.split('\n')[0])
          } else {
            console.error(`❌ 语句执行失败 (${i + 1}):`, error.message.split('\n')[0])
            errorCount++
          }
        } else {
          successCount++
          console.log(`✅ 语句执行成功 (${i + 1})`)
        }
        
      } catch (err) {
        console.error(`❌ 语句执行异常 (${i + 1}):`, err.message)
        errorCount++
      }
    }
    
    console.log('\n🎉 SQL迁移完成！')
    console.log('=====================================')
    console.log(`📊 执行统计:`)
    console.log(`  - 成功: ${successCount} 条`)
    console.log(`  - 失败: ${errorCount} 条`)
    
    // 验证表是否存在
    console.log('\n🔍 验证表结构...')
    const tables = ['slack_users', 'slack_channels', 'slack_messages', 'slack_reactions']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ 表 ${table} 不可访问:`, error.message)
        } else {
          console.log(`✅ 表 ${table} 验证成功`)
        }
      } catch (err) {
        console.log(`❌ 表 ${table} 验证失败:`, err.message)
      }
    }
    
    console.log('\n💡 现在可以运行: node scripts/migrate-to-supabase.js')
    return true
    
  } catch (error) {
    console.error('❌ SQL迁移失败:', error)
    return false
  }
}

// 运行迁移
if (require.main === module) {
  runSqlMigration().catch(console.error)
}

module.exports = { runSqlMigration }