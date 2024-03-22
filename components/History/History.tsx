import React, { useEffect, useState } from 'react';
import { supabase } from "@/supabaseClient";
import { Message } from "@/types";
import { Conversation } from "@/types";

export const History = () => {
  return <p>Your chat history:</p>;
};



export const ConversationsList = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

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

  return (
    <div>
      <div>
        {conversations.map(conversation => (
          <button key={conversation.id} onClick={() => setSelectedConversationId(conversation.id)}>
            Conversation {conversation.id}
          </button>
        ))}
      </div>
      
    </div>
  );
};

export default ConversationsList;
