import React, { useEffect, useState } from 'react';
import { supabase } from "@/supabaseClient";
import { Message } from "@/types";
import { Conversation } from "@/types";
import { ConversationTitle } from '@/types';

export const ConversationsList = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitles, setConversationTitles] = useState<ConversationTitle[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id');

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      setConversations(data);
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversationId) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversationId);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data);
    };

    fetchMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    const fetchConversationTitles = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title');

      if (error) {
        console.error('Error fetching conversation titles:', error);
        return;
      }

      setConversationTitles(data);
    };

    fetchConversationTitles();
  }, []);

  return (
    <div className="chat-container">
      <div className="sidebar">
        {conversationTitles.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => setSelectedConversationId(conversation.id)}
          >
            {conversation.title}
          </button>
        ))}
      </div>
      <div className="main-content">
        {selectedConversationId && messages.length > 0 ? (
          <div className="messages-container">
            <h2>Messages for Conversation {selectedConversationId}</h2>
            <div className="messages-list">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-bubble ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <p className="message-content">{message.content}</p>
                  
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>Select a conversation to view messages.</p>
        )}
      </div>
    </div>
  );
};


export default ConversationsList;
