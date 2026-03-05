export enum DealStage {
  NEW = 'Nuevo',
  QUALIFICATION = 'Cualificación',
  PROPOSAL = 'Propuesta',
  NEGOTIATION = 'Negociación',
  WON = 'Ganado',
  LOST = 'Perdido'
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  lastContacted: string;
  notes: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  contactId: string; // Links to a Contact
  expectedCloseDate: string;
  probability: number; // 0-100
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  date: string;
  relatedId: string; // Could be contactId or dealId
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export type Role = 'admin' | 'collaborator';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}