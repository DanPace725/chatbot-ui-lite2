export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo"
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = "assistant" | "user";

export interface Conversation {
  id: string;
  
  
}
export type ConversationId = string;


export interface ConversationTitle {
  id: string;
  title: string;

}
export type ConversationTitleId = string