export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  phoneNumber: string; // Alias for compatibility
  profilePicture?: string;
  lastSeen?: string;
  isOnline?: boolean;
  isBlocked?: boolean;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
  direction: 'incoming' | 'outgoing' | 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  replyTo?: string;
  isStarred?: boolean;
  isForwarded?: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components: {
    type: 'header' | 'body' | 'footer' | 'buttons';
    format?: 'text' | 'image' | 'video' | 'document';
    text?: string;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: {
      type: 'quick_reply' | 'url' | 'phone_number';
      text: string;
      url?: string;
      phone_number?: string;
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  targetContacts: string[];
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppWebhook {
  id: string;
  type: 'message' | 'status' | 'contact';
  data: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
}

export interface WhatsAppBusinessProfile {
  id: string;
  displayName: string;
  about?: string;
  email?: string;
  websites?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  profilePictureUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAnalytics {
  period: 'day' | 'week' | 'month';
  messagesSent: number;
  messagesReceived: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  activeContacts: number;
  newContacts: number;
  blockedContacts: number;
  templateMessagesSent: number;
  campaignsSent: number;
  averageResponseTime: number;
  date: string;
}

export interface WhatsAppSettings {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookUrl: string;
  webhookToken: string;
  isActive: boolean;
  autoReply: {
    enabled: boolean;
    message: string;
    workingHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  notifications: {
    newMessage: boolean;
    messageDelivered: boolean;
    messageRead: boolean;
    campaignCompleted: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
export type WhatsAppMessageDirection = 'incoming' | 'outgoing';
export type WhatsAppTemplateStatus = 'approved' | 'pending' | 'rejected';
export type WhatsAppCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';