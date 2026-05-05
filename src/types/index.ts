export type Personality = 'helpful' | 'technical' | 'casual' | 'formal';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'github';
  isPaid: boolean;
  subscriptionExpiry?: Date;
  dailyMessageCount: number;
  lastMessageDate: string;
  totalFilesUploaded: number;
  totalPhotosUploaded: number;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'code' | 'website' | 'file' | 'video' | 'project';
  metadata?: {
    imageUrl?: string;
    imageCaption?: string;
    websiteHtml?: string;
    fileName?: string;
    fileUrl?: string;
    language?: string;
    videoUrl?: string;
    videoName?: string;
    videoEditedUrl?: string;
    videoEditSummary?: string;
    projectName?: string;
    projectStructure?: string;
    projectFiles?: { path: string; content: string }[];
    projectSetup?: string;
    projectTechStack?: string;
    deployedUrl?: string;
    deployedExpiresAt?: string;
  };
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'video';
  url: string;
  size: number;
  mimeType?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  personality: Personality;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  sidebarOpen: boolean;
  personality: Personality;
  isLoading: boolean;
}

export type PersonalityConfig = {
  id: Personality;
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
};
