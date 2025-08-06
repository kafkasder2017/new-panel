import { supabase } from './supabaseClient';

// WhatsApp Business API konfigürasyonu
interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

// WhatsApp mesaj tipleri
interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

interface WhatsAppMediaMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image' | 'video' | 'audio' | 'document';
  image?: { link: string; caption?: string };
  video?: { link: string; caption?: string };
  audio?: { link: string };
  document?: { link: string; caption?: string; filename?: string };
}

type WhatsAppMessage = WhatsAppTextMessage | WhatsAppTemplateMessage | WhatsAppMediaMessage;

// WhatsApp webhook event tipleri
interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          image?: {
            caption?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      apiVersion: 'v18.0'
    };
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`;
  }

  // Mesaj gönderme
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      const data = await response.json();

      if (response.ok) {
        // Mesajı veritabanına kaydet
        await this.saveMessageToDatabase({
          wa_message_id: data.messages[0].id,
          direction: 'outbound',
          message_type: message.type,
          content: this.extractMessageContent(message),
          status: 'sent',
          timestamp: new Date().toISOString()
        }, message.to);

        return { success: true, messageId: data.messages[0].id };
      } else {
        return { success: false, error: data.error?.message || 'Mesaj gönderilemedi' };
      }
    } catch (error) {
      console.error('WhatsApp mesaj gönderme hatası:', error);
      return { success: false, error: 'API bağlantı hatası' };
    }
  }

  // Metin mesajı gönderme
  async sendTextMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message: WhatsAppTextMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };

    return this.sendMessage(message);
  }

  // Şablon mesajı gönderme
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'tr',
    parameters: string[] = []
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message: WhatsAppTemplateMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    if (parameters.length > 0) {
      message.template.components = [{
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: param
        }))
      }];
    }

    return this.sendMessage(message);
  }

  // Medya mesajı gönderme
  async sendMediaMessage(
    to: string, 
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
    caption?: string,
    filename?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message: WhatsAppMediaMessage = {
      messaging_product: 'whatsapp',
      to,
      type: mediaType
    };

    switch (mediaType) {
      case 'image':
        message.image = { link: mediaUrl, caption };
        break;
      case 'video':
        message.video = { link: mediaUrl, caption };
        break;
      case 'audio':
        message.audio = { link: mediaUrl };
        break;
      case 'document':
        message.document = { link: mediaUrl, caption, filename };
        break;
    }

    return this.sendMessage(message);
  }

  // Webhook doğrulama
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  // Webhook event işleme
  async processWebhookEvent(event: WhatsAppWebhookEvent): Promise<void> {
    try {
      // Webhook event'ini veritabanına kaydet
      await supabase
        .from('whatsapp_webhook_events')
        .insert({
          event_type: 'message_received',
          webhook_data: event,
          processed: false
        });

      for (const entry of event.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await this.processMessages(change.value);
            await this.processStatuses(change.value);
          }
        }
      }
    } catch (error) {
      console.error('Webhook event işleme hatası:', error);
    }
  }

  // Gelen mesajları işleme
  private async processMessages(value: any): Promise<void> {
    if (!value.messages) return;

    for (const message of value.messages) {
      try {
        // Kişiyi bul veya oluştur
        const contact = await this.findOrCreateContact(message.from, value.contacts?.[0]);
        
        // Mesajı veritabanına kaydet
        await this.saveMessageToDatabase({
          wa_message_id: message.id,
          contact_id: contact.id,
          direction: 'inbound',
          message_type: message.type,
          content: message.text?.body || '',
          media_url: message.image?.id || message.video?.id || message.audio?.id || message.document?.id,
          media_type: message.image?.mime_type || message.video?.mime_type || message.audio?.mime_type || message.document?.mime_type,
          media_caption: message.image?.caption || message.video?.caption || message.document?.caption,
          status: 'received',
          timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
        });

        // Otomatik yanıt kontrolü
        await this.checkAutoResponse(contact, message);
      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
      }
    }
  }

  // Mesaj durumlarını işleme
  private async processStatuses(value: any): Promise<void> {
    if (!value.statuses) return;

    for (const status of value.statuses) {
      try {
        await supabase
          .from('whatsapp_messages')
          .update({
            status: status.status,
            updated_at: new Date().toISOString()
          })
          .eq('wa_message_id', status.id);
      } catch (error) {
        console.error('Durum güncelleme hatası:', error);
      }
    }
  }

  // Kişi bulma veya oluşturma
  private async findOrCreateContact(phoneNumber: string, contactInfo?: any): Promise<any> {
    // Önce mevcut kişiyi ara
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingContact) {
      return existingContact;
    }

    // Yeni kişi oluştur
    const { data: newContact } = await supabase
      .from('whatsapp_contacts')
      .insert({
        phone_number: phoneNumber,
        display_name: contactInfo?.profile?.name || phoneNumber,
        wa_id: contactInfo?.wa_id || phoneNumber,
        status: 'active'
      })
      .select()
      .single();

    return newContact;
  }

  // Mesajı veritabanına kaydetme
  private async saveMessageToDatabase(messageData: any, phoneNumber?: string): Promise<void> {
    if (phoneNumber && !messageData.contact_id) {
      const contact = await this.findOrCreateContact(phoneNumber);
      messageData.contact_id = contact.id;
    }

    await supabase
      .from('whatsapp_messages')
      .insert(messageData);
  }

  // Mesaj içeriğini çıkarma
  private extractMessageContent(message: WhatsAppMessage): string {
    if (message.type === 'text') {
      return (message as WhatsAppTextMessage).text.body;
    } else if (message.type === 'template') {
      return `Template: ${(message as WhatsAppTemplateMessage).template.name}`;
    }
    return `Media: ${message.type}`;
  }

  // Otomatik yanıt kontrolü
  private async checkAutoResponse(contact: any, message: any): Promise<void> {
    // Basit otomatik yanıt mantığı
    if (message.text?.body?.toLowerCase().includes('merhaba')) {
      await this.sendTemplateMessage(contact.phone_number, 'hosgeldin_mesaji', 'tr', [contact.display_name]);
    }
  }

  // Kampanya gönderimi
  async sendCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: campaign } = await supabase
        .from('whatsapp_campaigns')
        .select(`
          *,
          whatsapp_templates(*),
          whatsapp_campaign_recipients(
            *,
            whatsapp_contacts(*)
          )
        `)
        .eq('id', campaignId)
        .single();

      if (!campaign) {
        return { success: false, error: 'Kampanya bulunamadı' };
      }

      // Kampanya durumunu güncelle
      await supabase
        .from('whatsapp_campaigns')
        .update({ status: 'running' })
        .eq('id', campaignId);

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of campaign.whatsapp_campaign_recipients) {
        try {
          const result = await this.sendTemplateMessage(
            recipient.whatsapp_contacts.phone_number,
            campaign.whatsapp_templates.name,
            campaign.whatsapp_templates.language
          );

          if (result.success) {
            sentCount++;
            await supabase
              .from('whatsapp_campaign_recipients')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', recipient.id);
          } else {
            failedCount++;
            await supabase
              .from('whatsapp_campaign_recipients')
              .update({
                status: 'failed',
                error_message: result.error
              })
              .eq('id', recipient.id);
          }
        } catch (error) {
          failedCount++;
          console.error('Kampanya mesaj gönderme hatası:', error);
        }
      }

      // Kampanya istatistiklerini güncelle
      await supabase
        .from('whatsapp_campaigns')
        .update({
          status: 'completed',
          sent_count: sentCount,
          failed_count: failedCount
        })
        .eq('id', campaignId);

      return { success: true };
    } catch (error) {
      console.error('Kampanya gönderme hatası:', error);
      return { success: false, error: 'Kampanya gönderme hatası' };
    }
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;