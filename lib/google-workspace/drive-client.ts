/**
 * Google Drive API客户端
 * 处理Drive文件操作
 */

import { google } from 'googleapis'
import { GoogleCredentials } from './types'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime: string
  modifiedTime: string
  webViewLink?: string
  webContentLink?: string
  owners?: Array<{
    displayName: string
    emailAddress: string
  }>
  shared: boolean
  folder: boolean
}

export class DriveApiClient {
  private credentials: GoogleCredentials

  constructor(credentials: GoogleCredentials) {
    this.credentials = credentials
  }

  /**
   * 创建认证的Drive客户端
   */
  private createDriveClient() {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: this.credentials.access_token
    })

    return google.drive({ version: 'v3', auth: oauth2Client })
  }

  /**
   * 验证Drive连接
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const drive = this.createDriveClient()
      await drive.about.get({ fields: 'user' })
      return true
    } catch (error) {
      console.error('Drive连接验证失败:', error)
      return false
    }
  }

  /**
   * 获取用户信息和存储配额
   */
  async getUserInfo(): Promise<{
    user?: {
      displayName: string
      emailAddress: string
    }
    storageQuota?: {
      limit: string
      usage: string
      usageInDrive: string
    }
  } | null> {
    try {
      const drive = this.createDriveClient()
      const response = await drive.about.get({ 
        fields: 'user,storageQuota' 
      })

      return {
        user: response.data.user,
        storageQuota: response.data.storageQuota
      }
    } catch (error) {
      console.error('获取Drive用户信息失败:', error)
      return null
    }
  }

  /**
   * 获取文件列表
   */
  async getFiles(options: {
    pageSize?: number
    query?: string
    orderBy?: string
  } = {}): Promise<DriveFile[]> {
    try {
      const drive = this.createDriveClient()
      const {
        pageSize = 50,
        query = '',
        orderBy = 'modifiedTime desc'
      } = options

      const response = await drive.files.list({
        pageSize,
        q: query,
        orderBy,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,shared,parents)'
      })

      const files = response.data.files || []
      
      return files.map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: file.size,
        createdTime: file.createdTime!,
        modifiedTime: file.modifiedTime!,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        owners: file.owners,
        shared: file.shared || false,
        folder: file.mimeType === 'application/vnd.google-apps.folder'
      }))
    } catch (error) {
      console.error('获取Drive文件失败:', error)
      return []
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(searchTerm: string, pageSize: number = 50): Promise<DriveFile[]> {
    const query = `name contains '${searchTerm}' or fullText contains '${searchTerm}'`
    return this.getFiles({ query, pageSize })
  }

  /**
   * 获取最近修改的文件
   */
  async getRecentFiles(pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFiles({ 
      pageSize, 
      orderBy: 'modifiedTime desc',
      query: 'trashed=false'
    })
  }

  /**
   * 获取共享文件
   */
  async getSharedFiles(pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFiles({ 
      pageSize, 
      query: 'sharedWithMe=true and trashed=false' 
    })
  }

  /**
   * 获取文件夹内容
   */
  async getFolderContents(folderId: string, pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFiles({ 
      pageSize, 
      query: `'${folderId}' in parents and trashed=false` 
    })
  }

  /**
   * 获取特定类型的文件
   */
  async getFilesByType(mimeType: string, pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFiles({ 
      pageSize, 
      query: `mimeType='${mimeType}' and trashed=false` 
    })
  }

  /**
   * 获取Google Docs文档
   */
  async getDocs(pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFilesByType('application/vnd.google-apps.document', pageSize)
  }

  /**
   * 获取Google Sheets表格
   */
  async getSheets(pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFilesByType('application/vnd.google-apps.spreadsheet', pageSize)
  }

  /**
   * 获取Google Slides演示文稿
   */
  async getSlides(pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFilesByType('application/vnd.google-apps.presentation', pageSize)
  }

  /**
   * 获取文件夹
   */
  async getFolders(pageSize: number = 50): Promise<DriveFile[]> {
    return this.getFilesByType('application/vnd.google-apps.folder', pageSize)
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(sizeBytes?: string): string {
    if (!sizeBytes) return 'Unknown'
    
    const bytes = parseInt(sizeBytes)
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    
    if (bytes === 0) return '0 Byte'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = (bytes / Math.pow(1024, i)).toFixed(1)
    
    return `${size} ${sizes[i]}`
  }

  /**
   * 获取文件类型显示名称
   */
  getFileTypeDisplayName(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'Google 文档',
      'application/vnd.google-apps.spreadsheet': 'Google 表格',
      'application/vnd.google-apps.presentation': 'Google 幻灯片',
      'application/vnd.google-apps.folder': '文件夹',
      'application/vnd.google-apps.form': 'Google 表单',
      'application/vnd.google-apps.drawing': 'Google 绘图',
      'application/pdf': 'PDF 文档',
      'application/msword': 'Word 文档',
      'application/vnd.ms-excel': 'Excel 表格',
      'application/vnd.ms-powerpoint': 'PowerPoint 演示文稿',
      'text/plain': '纯文本',
      'image/jpeg': 'JPEG 图片',
      'image/png': 'PNG 图片',
      'image/gif': 'GIF 图片',
      'video/mp4': 'MP4 视频',
      'audio/mpeg': 'MP3 音频'
    }

    return typeMap[mimeType] || mimeType
  }
}