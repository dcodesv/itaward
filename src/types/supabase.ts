// Este archivo se generará automáticamente cuando ejecutes:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
//
// Por ahora, es un placeholder para los tipos de la base de datos de Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
