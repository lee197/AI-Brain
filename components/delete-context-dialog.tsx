'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { Context } from '@/types/context'
import { 
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Database,
  Brain,
  MessageSquare,
  FileText,
  GitBranch,
  Loader2,
  XCircle
} from 'lucide-react'

interface DeleteContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: Context | null
  onConfirmDelete: (contextId: string) => Promise<void>
}

export function DeleteContextDialog({
  open,
  onOpenChange,
  context,
  onConfirmDelete
}: DeleteContextDialogProps) {
  const { t, language } = useLanguage()
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expectedConfirmText = language === 'zh' ? '永久删除' : 'DELETE FOREVER'
  const isConfirmValid = confirmText === expectedConfirmText

  const handleDelete = async () => {
    if (!context || !isConfirmValid) return

    setIsDeleting(true)
    setError(null)

    try {
      await onConfirmDelete(context.id)
      onOpenChange(false)
      // Reset state
      setConfirmText('')
    } catch (err) {
      setError(language === 'zh' 
        ? '删除失败，请稍后重试' 
        : 'Failed to delete. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false)
      setConfirmText('')
      setError(null)
    }
  }

  if (!context) return null

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl">
              {language === 'zh' 
                ? `删除工作空间 "${context.name}"？` 
                : `Delete workspace "${context.name}"?`
              }
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <AlertDialogDescription className="text-base">
            {language === 'zh' 
              ? '此操作无法撤销。删除此工作空间将会：' 
              : 'This action cannot be undone. Deleting this workspace will:'
            }
          </AlertDialogDescription>

          {/* 警告列表 */}
          <div className="space-y-3 bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-sm">
                  {language === 'zh' ? 'AI 学习数据' : 'AI Learning Data'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'zh' 
                    ? '永久删除所有 AI 训练数据、对话历史和学习模型'
                    : 'Permanently delete all AI training data, conversation history, and learned models'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-sm">
                  {language === 'zh' ? 'Context 存储' : 'Context Storage'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'zh' 
                    ? '永久删除所有向量数据库内容、知识图谱和索引'
                    : 'Permanently delete all vector database content, knowledge graphs, and indexes'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-sm">
                  {language === 'zh' ? '集成数据' : 'Integration Data'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'zh' 
                    ? '断开所有数据源连接，删除同步的 Slack、Jira、GitHub 等数据'
                    : 'Disconnect all data sources and delete synced Slack, Jira, GitHub data'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-sm">
                  {language === 'zh' ? '文档和文件' : 'Documents & Files'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'zh' 
                    ? '永久删除所有上传的文档、生成的报告和分析结果'
                    : 'Permanently delete all uploaded documents, generated reports, and analysis results'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 成员影响警告 */}
          {context.members && context.members.length > 1 && (
            <Alert className="border-warning bg-warning/10">
              <ShieldAlert className="w-4 h-4" />
              <AlertDescription>
                {language === 'zh' 
                  ? `此工作空间有 ${context.members.length} 名成员。删除后所有成员将失去访问权限。`
                  : `This workspace has ${context.members.length} members. All members will lose access after deletion.`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* 确认输入 */}
          <div className="space-y-3 pt-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              {language === 'zh' 
                ? `请输入 "${expectedConfirmText}" 以确认删除：`
                : `Type "${expectedConfirmText}" to confirm deletion:`
              }
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirmText}
              className={`${isConfirmValid ? 'border-destructive' : ''}`}
              disabled={isDeleting}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {language === 'zh' ? '取消' : 'Cancel'}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'zh' ? '删除中...' : 'Deleting...'}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {language === 'zh' ? '永久删除' : 'Delete Forever'}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}