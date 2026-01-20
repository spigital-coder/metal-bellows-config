import { BellowsPart, QuoteSubmission } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibasglziaqxtywitwqwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYXNnbHppYXF4dHl3aXR3cXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODQ5NzMsImV4cCI6MjA4MzE2MDk3M30.xrCJV1xxWAjb9u84dduiTenVVHLtaG1ubcaPMyN4FUg';

export const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'BSI-product-images';

export const db = {
  auth: {
    signIn: async (email: string, pass: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, error: null, user: data.user };
      } catch (e: any) {
        return { success: false, error: e.message || "Network error." };
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    getSession: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
      } catch {
        return null;
      }
    }
  },

  storage: {
    uploadImage: async (file: File): Promise<{url: string | null, error: string | null}> => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `parts/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        if (uploadError) return { url: null, error: uploadError.message };
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        return { url: data.publicUrl, error: null };
      } catch (e: any) {
        return { url: null, error: e.message };
      }
    }
  },

  getAll: async (): Promise<BellowsPart[]> => {
    try {
      const { data, error } = await supabase.from('bellows_parts').select('*').order('part_number', { ascending: true });
      return data || [];
    } catch {
      return [];
    }
  },

  create: async (newPart: BellowsPart): Promise<{success: boolean, error?: string}> => {
    try {
      const { error } = await supabase.from('bellows_parts').insert([newPart]);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  update: async (partNumber: string, data: Partial<BellowsPart>): Promise<{success: boolean, error?: string}> => {
    try {
      const { error } = await supabase.from('bellows_parts').update(data).eq('part_number', partNumber);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  delete: async (partNumber: string): Promise<{success: boolean, error?: string}> => {
    try {
      const { error } = await supabase.from('bellows_parts').delete().eq('part_number', partNumber);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  submissions: {
    getAll: async (): Promise<{data: QuoteSubmission[], error: any}> => {
      try {
        const { data, error } = await supabase.from('quote_submissions').select('*').order('created_at', { ascending: false });
        return { data: data || [], error };
      } catch (e) {
        return { data: [], error: e };
      }
    },
    create: async (submission: QuoteSubmission): Promise<{success: boolean, error?: string}> => {
      try {
        const { error } = await supabase.from('quote_submissions').insert([submission]);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    update: async (id: string, data: Partial<QuoteSubmission>): Promise<{success: boolean, error?: string}> => {
      try {
        const { error } = await supabase.from('quote_submissions').update(data).eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    delete: async (id: string): Promise<{success: boolean, error?: string}> => {
      try {
        const { error } = await supabase.from('quote_submissions').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
  }
};