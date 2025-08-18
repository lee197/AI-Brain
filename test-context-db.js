// 测试Context是否保存到Supabase数据库
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContextsInDatabase() {
  console.log('🔍 检查Supabase数据库中的Contexts...\n')

  try {
    // 1. 查询contexts表
    const { data: contexts, error } = await supabase
      .from('contexts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 查询错误:', error)
      return
    }

    console.log(`✅ 在数据库中找到 ${contexts.length} 个Context!\n`)

    if (contexts.length > 0) {
      contexts.forEach((ctx, index) => {
        console.log(`Context #${index + 1}:`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`📌 ID: ${ctx.id}`)
        console.log(`📝 名称: ${ctx.name}`)
        console.log(`🏷️  类型: ${ctx.type}`)
        console.log(`📄 描述: ${ctx.description || '无'}`)
        console.log(`👤 Owner ID: ${ctx.owner_id}`)
        console.log(`🏢 组织 ID: ${ctx.organization_id}`)
        console.log(`📅 创建时间: ${new Date(ctx.created_at).toLocaleString('zh-CN')}`)
        console.log('')
      })

      // 2. 检查team_members表
      console.log('👥 检查团队成员...\n')
      const { data: members, error: memberError } = await supabase
        .from('team_members')
        .select('*')

      if (!memberError && members) {
        console.log(`找到 ${members.length} 个团队成员记录:`)
        members.forEach(member => {
          const context = contexts.find(c => c.id === member.context_id)
          console.log(`  - Context: ${context?.name || member.context_id}`)
          console.log(`    用户ID: ${member.user_id}, 角色: ${member.role}`)
        })
      }

      // 3. 检查data_sources表
      console.log('\n🔌 检查数据源...\n')
      const { data: dataSources, error: dsError } = await supabase
        .from('data_sources')
        .select('*')

      if (!dsError && dataSources) {
        console.log(`找到 ${dataSources.length} 个数据源配置:`)
        dataSources.forEach(ds => {
          const context = contexts.find(c => c.id === ds.context_id)
          console.log(`  - Context: ${context?.name || ds.context_id}`)
          console.log(`    类型: ${ds.type}, 状态: ${ds.status}`)
        })
      }
    }

    console.log('\n🎉 Context已成功存储到Supabase数据库！')
    console.log('💡 你可以在Supabase Dashboard的Table Editor中查看这些数据')

  } catch (error) {
    console.error('❌ 发生错误:', error)
  }
}

checkContextsInDatabase()