/**
 * Google Workspace API Types
 */

export interface GoogleCredentials {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    partId: string
    mimeType: string
    filename: string
    headers: Array<{
      name: string
      value: string
    }>
    body: {
      attachmentId?: string
      size: number
      data?: string
    }
    parts?: any[]
  }
  sizeEstimate: number
  historyId: string
  internalDate: string
}

export interface GmailThread {
  id: string
  historyId: string
  messages: GmailMessage[]
}

export interface GmailLabel {
  id: string
  name: string
  messageListVisibility: string
  labelListVisibility: string
  type: string
  messagesTotal?: number
  messagesUnread?: number
  threadsTotal?: number
  threadsUnread?: number
}

export interface ProcessedEmail {
  id: string
  threadId: string
  subject: string
  sender: string
  senderEmail: string
  recipients: string[]
  content: string
  timestamp: string
  isRead: boolean
  labels: string[]
  attachments: Array<{
    filename: string
    mimeType: string
    size: number
    attachmentId: string
  }>
  snippet: string
}

export interface GmailApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface GmailListResponse {
  messages: Array<{
    id: string
    threadId: string
  }>
  nextPageToken?: string
  resultSizeEstimate: number
}

export interface GmailSearchQuery {
  q?: string
  labelIds?: string[]
  maxResults?: number
  pageToken?: string
  includeSpamTrash?: boolean
}