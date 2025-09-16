export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  type: 'text' | 'card';
  text?: string;           // role=user/assistant 일반 텍스트
  payload?: any;           // role=assistant 카드(SummaryResult 등)
  createdAt: number;
}
