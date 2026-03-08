export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          cpf_cnpj: string
          created_at: string
          email: string
          endereco: string
          estado: string
          id: string
          nome: string
          telefone: string
          user_id: string
        }
        Insert: {
          bairro?: string
          cep?: string
          cidade?: string
          cpf_cnpj?: string
          created_at?: string
          email?: string
          endereco?: string
          estado?: string
          id?: string
          nome: string
          telefone?: string
          user_id: string
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          cpf_cnpj?: string
          created_at?: string
          email?: string
          endereco?: string
          estado?: string
          id?: string
          nome?: string
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      custos: {
        Row: {
          id: string
          nome: string
          user_id: string
          valor: number
        }
        Insert: {
          id?: string
          nome: string
          user_id: string
          valor?: number
        }
        Update: {
          id?: string
          nome?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      empresa_config: {
        Row: {
          assinatura: string | null
          cnpj: string
          email: string
          endereco: string
          id: string
          logo: string | null
          nome: string
          telefone: string
          user_id: string
        }
        Insert: {
          assinatura?: string | null
          cnpj?: string
          email?: string
          endereco?: string
          id?: string
          logo?: string | null
          nome?: string
          telefone?: string
          user_id: string
        }
        Update: {
          assinatura?: string | null
          cnpj?: string
          email?: string
          endereco?: string
          id?: string
          logo?: string | null
          nome?: string
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      orcamento_itens: {
        Row: {
          custo_unitario: number
          descricao: string
          id: string
          margem_lucro: number
          orcamento_id: string
          quantidade: number
          unidade: string
          valor_unitario: number
        }
        Insert: {
          custo_unitario?: number
          descricao: string
          id?: string
          margem_lucro?: number
          orcamento_id: string
          quantidade?: number
          unidade?: string
          valor_unitario?: number
        }
        Update: {
          custo_unitario?: number
          descricao?: string
          id?: string
          margem_lucro?: number
          orcamento_id?: string
          quantidade?: number
          unidade?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_materiais: {
        Row: {
          custo_unitario: number
          id: string
          margem_lucro: number
          nome: string
          orcamento_id: string
          quantidade: number
          unidade: string
          valor: number
        }
        Insert: {
          custo_unitario?: number
          id?: string
          margem_lucro?: number
          nome: string
          orcamento_id: string
          quantidade?: number
          unidade?: string
          valor?: number
        }
        Update: {
          custo_unitario?: number
          id?: string
          margem_lucro?: number
          nome?: string
          orcamento_id?: string
          quantidade?: number
          unidade?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_materiais_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          assinatura: string | null
          cliente_id: string
          cliente_nome: string
          created_at: string
          id: string
          mao_de_obra: number
          observacoes: string
          status: string
          user_id: string
          validade: string
        }
        Insert: {
          assinatura?: string | null
          cliente_id?: string
          cliente_nome: string
          created_at?: string
          id?: string
          mao_de_obra?: number
          observacoes?: string
          status?: string
          user_id: string
          validade?: string
        }
        Update: {
          assinatura?: string | null
          cliente_id?: string
          cliente_nome?: string
          created_at?: string
          id?: string
          mao_de_obra?: number
          observacoes?: string
          status?: string
          user_id?: string
          validade?: string
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          cliente_id: string
          cliente_nome: string
          codigo: string
          created_at: string
          data: string
          descricao: string
          foto_antes: string | null
          foto_depois: string | null
          id: string
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id?: string
          cliente_nome: string
          codigo?: string
          created_at?: string
          data: string
          descricao: string
          foto_antes?: string | null
          foto_depois?: string | null
          id?: string
          status?: string
          user_id: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          cliente_nome?: string
          codigo?: string
          created_at?: string
          data?: string
          descricao?: string
          foto_antes?: string | null
          foto_depois?: string | null
          id?: string
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assinatura: string | null
          bairro: string | null
          cidade: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          empresa: string | null
          endereco: string | null
          estado: string | null
          id: string
          logo: string | null
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assinatura?: string | null
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assinatura?: string | null
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recibos: {
        Row: {
          cliente_id: string
          cliente_nome: string
          created_at: string
          descricao: string
          forma_pagamento: string
          id: string
          numero: number
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id?: string
          cliente_nome: string
          created_at?: string
          descricao?: string
          forma_pagamento?: string
          id?: string
          numero?: number
          user_id: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          cliente_nome?: string
          created_at?: string
          descricao?: string
          forma_pagamento?: string
          id?: string
          numero?: number
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
