export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          settings: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          settings?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          settings?: Record<string, any>
          created_at?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          user_id: string
          organization_id: string
          role: string
        }
        Insert: {
          user_id: string
          organization_id: string
          role?: string
        }
        Update: {
          user_id?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contexts: {
        Row: {
          id: string
          name: string
          type: 'PROJECT' | 'TEAM' | 'DEPARTMENT' | 'CLIENT' | 'PERSONAL'
          description: string | null
          owner_id: string | null
          organization_id: string | null
          settings: Record<string, any>
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'PROJECT' | 'TEAM' | 'DEPARTMENT' | 'CLIENT' | 'PERSONAL'
          description?: string | null
          owner_id?: string | null
          organization_id?: string | null
          settings?: Record<string, any>
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'PROJECT' | 'TEAM' | 'DEPARTMENT' | 'CLIENT' | 'PERSONAL'
          description?: string | null
          owner_id?: string | null
          organization_id?: string | null
          settings?: Record<string, any>
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contexts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contexts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          context_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          permissions: Record<string, any>
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          context_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          permissions?: Record<string, any>
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          context_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          permissions?: Record<string, any>
          invited_by?: string | null
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      data_sources: {
        Row: {
          id: string
          context_id: string
          type: 'slack' | 'jira' | 'github' | 'google' | 'notion'
          name: string
          config: Record<string, any>
          status: 'pending' | 'connected' | 'error' | 'syncing'
          last_sync_at: string | null
          sync_frequency: number
          created_at: string
        }
        Insert: {
          id?: string
          context_id: string
          type: 'slack' | 'jira' | 'github' | 'google' | 'notion'
          name: string
          config: Record<string, any>
          status?: 'pending' | 'connected' | 'error' | 'syncing'
          last_sync_at?: string | null
          sync_frequency?: number
          created_at?: string
        }
        Update: {
          id?: string
          context_id?: string
          type?: 'slack' | 'jira' | 'github' | 'google' | 'notion'
          name?: string
          config?: Record<string, any>
          status?: 'pending' | 'connected' | 'error' | 'syncing'
          last_sync_at?: string | null
          sync_frequency?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          user_id: string | null
          context_id: string | null
          organization_id: string | null
          title: string | null
          summary: string | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          context_id?: string | null
          organization_id?: string | null
          title?: string | null
          summary?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          context_id?: string | null
          organization_id?: string | null
          title?: string | null
          summary?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Record<string, any>
          tokens_used: number | null
          model: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Record<string, any>
          tokens_used?: number | null
          model?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Record<string, any>
          tokens_used?: number | null
          model?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      actions: {
        Row: {
          id: string
          message_id: string
          type: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          integration_id: string | null
          data_source_id: string | null
          payload: Record<string, any>
          result: Record<string, any> | null
          error: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          type: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          integration_id?: string | null
          data_source_id?: string | null
          payload: Record<string, any>
          result?: Record<string, any> | null
          error?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          type?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          integration_id?: string | null
          data_source_id?: string | null
          payload?: Record<string, any>
          result?: Record<string, any> | null
          error?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_base: {
        Row: {
          id: string
          context_id: string
          source_id: string | null
          content: string
          embedding: number[] | null
          metadata: Record<string, any>
          source_type: 'document' | 'message' | 'code' | 'ticket' | 'meeting' | 'email' | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          context_id: string
          source_id?: string | null
          content: string
          embedding?: number[] | null
          metadata?: Record<string, any>
          source_type?: 'document' | 'message' | 'code' | 'ticket' | 'meeting' | 'email' | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          context_id?: string
          source_id?: string | null
          content?: string
          embedding?: number[] | null
          metadata?: Record<string, any>
          source_type?: 'document' | 'message' | 'code' | 'ticket' | 'meeting' | 'email' | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          }
        ]
      }
      workflows: {
        Row: {
          id: string
          context_id: string
          name: string
          description: string | null
          trigger_type: 'manual' | 'schedule' | 'event' | 'webhook'
          trigger_config: Record<string, any>
          actions: Record<string, any>
          enabled: boolean
          last_run_at: string | null
          run_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          context_id: string
          name: string
          description?: string | null
          trigger_type: 'manual' | 'schedule' | 'event' | 'webhook'
          trigger_config: Record<string, any>
          actions: Record<string, any>
          enabled?: boolean
          last_run_at?: string | null
          run_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          context_id?: string
          name?: string
          description?: string | null
          trigger_type?: 'manual' | 'schedule' | 'event' | 'webhook'
          trigger_config?: Record<string, any>
          actions?: Record<string, any>
          enabled?: boolean
          last_run_at?: string | null
          run_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          context_id: string | null
          details: Record<string, any>
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          context_id?: string | null
          details?: Record<string, any>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          context_id?: string | null
          details?: Record<string, any>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // ÝYŸ	„profilesh|¹'
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}