import { supabase } from '../lib/supabase';
import {
  WhatsAppContact,
  WhatsAppMessage,
  WhatsAppTemplate,
  WhatsAppCampaign,
  WhatsAppBusinessProfile,
  WhatsAppAnalytics,
  WhatsAppSettings
} from '../types/whatsapp';

// Contact Management
export const getWhatsAppContacts = async (): Promise<WhatsAppContact[]> => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getWhatsAppContact = async (id: string): Promise<WhatsAppContact | null> => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createWhatsAppContact = async (contact: Omit<WhatsAppContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppContact> => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .insert({
      ...contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWhatsAppContact = async (id: string, updates: Partial<WhatsAppContact>): Promise<WhatsAppContact> => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWhatsAppContact = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('whatsapp_contacts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Message Management
export const getWhatsAppMessages = async (contactId?: string, limit = 50): Promise<WhatsAppMessage[]> => {
  let query = supabase
    .from('whatsapp_messages')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (contactId) {
    query = query.eq('contact_id', contactId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const sendWhatsAppMessage = async (message: Omit<WhatsAppMessage, 'id' | 'timestamp' | 'status'>): Promise<WhatsAppMessage> => {
  // First, save to database
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert({
      ...message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: Integrate with WhatsApp Business API
  // This would involve making an API call to WhatsApp Business API
  // For now, we'll just return the saved message

  return data;
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('whatsapp_messages')
    .update({ status: 'read' })
    .eq('id', messageId);

  if (error) throw error;
};

export const starMessage = async (messageId: string, isStarred: boolean): Promise<void> => {
  const { error } = await supabase
    .from('whatsapp_messages')
    .update({ is_starred: isStarred })
    .eq('id', messageId);

  if (error) throw error;
};

// Template Management
export const getWhatsAppTemplates = async (): Promise<WhatsAppTemplate[]> => {
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createWhatsAppTemplate = async (template: Omit<WhatsAppTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppTemplate> => {
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .insert({
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Campaign Management
export const getWhatsAppCampaigns = async (): Promise<WhatsAppCampaign[]> => {
  const { data, error } = await supabase
    .from('whatsapp_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createWhatsAppCampaign = async (campaign: Omit<WhatsAppCampaign, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'failedCount'>): Promise<WhatsAppCampaign> => {
  const { data, error } = await supabase
    .from('whatsapp_campaigns')
    .insert({
      ...campaign,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCampaignStatus = async (campaignId: string, status: WhatsAppCampaign['status']): Promise<void> => {
  const { error } = await supabase
    .from('whatsapp_campaigns')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);

  if (error) throw error;
};

// Business Profile Management
export const getWhatsAppBusinessProfile = async (): Promise<WhatsAppBusinessProfile | null> => {
  const { data, error } = await supabase
    .from('whatsapp_business_profile')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};

export const updateWhatsAppBusinessProfile = async (profile: Partial<WhatsAppBusinessProfile>): Promise<WhatsAppBusinessProfile> => {
  const { data, error } = await supabase
    .from('whatsapp_business_profile')
    .upsert({
      ...profile,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Analytics
export const getWhatsAppAnalytics = async (period: 'day' | 'week' | 'month' = 'week'): Promise<WhatsAppAnalytics[]> => {
  const { data, error } = await supabase
    .from('whatsapp_analytics')
    .select('*')
    .eq('period', period)
    .order('date', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
};

// Settings
export const getWhatsAppSettings = async (): Promise<WhatsAppSettings | null> => {
  const { data, error } = await supabase
    .from('whatsapp_settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateWhatsAppSettings = async (settings: Partial<WhatsAppSettings>): Promise<WhatsAppSettings> => {
  const { data, error } = await supabase
    .from('whatsapp_settings')
    .upsert({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Search and Filter
export const searchWhatsAppContacts = async (query: string): Promise<WhatsAppContact[]> => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,notes.ilike.%${query}%`)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getContactMessages = async (contactId: string, limit = 50, offset = 0): Promise<WhatsAppMessage[]> => {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

// Real-time subscriptions
export const subscribeToMessages = (contactId: string, callback: (message: WhatsAppMessage) => void) => {
  return supabase
    .channel('whatsapp_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `contact_id=eq.${contactId}`
      },
      (payload) => {
        callback(payload.new as WhatsAppMessage);
      }
    )
    .subscribe();
};

export const subscribeToContactUpdates = (callback: (contact: WhatsAppContact) => void) => {
  return supabase
    .channel('whatsapp_contacts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'whatsapp_contacts'
      },
      (payload) => {
        callback(payload.new as WhatsAppContact);
      }
    )
    .subscribe();
};

// WhatsApp Service Class
class WhatsAppService {
  async getContacts(): Promise<WhatsAppContact[]> {
    return getWhatsAppContacts();
  }

  async getContact(id: string): Promise<WhatsAppContact | null> {
    return getWhatsAppContact(id);
  }

  async createContact(contact: Omit<WhatsAppContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppContact> {
    return createWhatsAppContact(contact);
  }

  async updateContact(id: string, updates: Partial<WhatsAppContact>): Promise<WhatsAppContact> {
    return updateWhatsAppContact(id, updates);
  }

  async deleteContact(id: string): Promise<void> {
    return deleteWhatsAppContact(id);
  }

  async getMessagesByContact(contactId: string, limit = 50): Promise<WhatsAppMessage[]> {
    return getContactMessages(contactId, limit);
  }

  async sendMessage(message: Omit<WhatsAppMessage, 'id' | 'timestamp' | 'status'>): Promise<WhatsAppMessage> {
    return sendWhatsAppMessage(message);
  }

  async markAsRead(messageId: string): Promise<void> {
    return markMessageAsRead(messageId);
  }

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    return getWhatsAppTemplates();
  }

  async createTemplate(template: Omit<WhatsAppTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppTemplate> {
    return createWhatsAppTemplate(template);
  }

  async getCampaigns(): Promise<WhatsAppCampaign[]> {
    return getWhatsAppCampaigns();
  }

  async createCampaign(campaign: Omit<WhatsAppCampaign, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'failedCount'>): Promise<WhatsAppCampaign> {
    return createWhatsAppCampaign(campaign);
  }

  async getBusinessProfile(): Promise<WhatsAppBusinessProfile | null> {
    return getWhatsAppBusinessProfile();
  }

  async updateBusinessProfile(profile: Partial<WhatsAppBusinessProfile>): Promise<WhatsAppBusinessProfile> {
    return updateWhatsAppBusinessProfile(profile);
  }

  async getAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<WhatsAppAnalytics[]> {
    return getWhatsAppAnalytics(period);
  }

  async getSettings(): Promise<WhatsAppSettings | null> {
    return getWhatsAppSettings();
  }

  async updateSettings(settings: Partial<WhatsAppSettings>): Promise<WhatsAppSettings> {
    return updateWhatsAppSettings(settings);
  }

  async searchContacts(query: string): Promise<WhatsAppContact[]> {
    return searchWhatsAppContacts(query);
  }

  subscribeToMessages(contactId: string, callback: (message: WhatsAppMessage) => void) {
    return subscribeToMessages(contactId, callback);
  }

  subscribeToContactUpdates(callback: (contact: WhatsAppContact) => void) {
    return subscribeToContactUpdates(callback);
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;