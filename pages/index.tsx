// pages/index.tsx
import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import { ConversationId } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { ConversationsList } from "@/components/History/History";

export default function Home() {
 const [messages, setMessages] = useState<Message[]>([]);
 const [loading, setLoading] = useState<boolean>(false);
 const [conversationId, setConversationId] = useState<ConversationId>('');
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'editor'

 const toggleView = () => {
  setCurrentView(currentView === 'chat' ? 'History' : 'chat');
};


 function generateConversationId() {
  return uuidv4(); // This function generates a unique UUID
}


 const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 };

 const saveMessageToDatabase = async (message: Message, convoId: string) => {
    const { error } = await supabase.from("messages").insert([
      {
        content: message.content,
        role: message.role,
        conversation_id: convoId,
        
      },
    ]);

    if (error) {
      console.error("Error saving message to database", error);
    }
 };

 // Function to fetch conversations from the database
const fetchConversations = async () => {
  const { data, error } = await supabase.from('messages').select('*');
  if (error) {
    console.error("Error fetching conversations: ", error);
  }
  return data;
};

 // New function to insert a conversation into the database
 const insertConversation = async (): Promise<string> => {
  // Check if the conversation already exists in the state
  if (!conversationId) {
    // Generate a new conversation ID
    const newConvoId = generateConversationId();
    // Insert the new conversation record into the 'conversations' table
    const { error } = await supabase.from('conversations').insert([{ id: newConvoId }]);

    // If there's an error, log it and stop the process
    if (error) {
      console.error("Error inserting new conversation: ", error);
      return "-";
    }

    // If successful, update the state with the new conversation ID
    setConversationId(newConvoId);
    return newConvoId;
  }

  // Return existing conversation ID if it's already in the state
  return conversationId;
};


const handleSend = async (message: Message) => {
  let convoId = conversationId;
  
  // If there's no conversation ID, create a new one
  if (!convoId) {
    convoId = await insertConversation();
  }
  
  // Insert the new conversation record into the 'conversations' table
  const { error } = await supabase.from('conversations').insert([{ id: convoId }]);

  // If there's an error, log it and stop the process
  if (error) {
    console.error("Error inserting new conversation: ", error);
    setLoading(false);
    return;
  }

  // If successful, update the state with the new conversation ID
  setConversationId(convoId);
  

const updatedMessages = [...messages, message];
setMessages(updatedMessages);
    
await saveMessageToDatabase(message, convoId);


setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
      }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    const data = response.body;
    if (!data) {
      return;
    }

    setLoading(false);
    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let assistantResponse = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      assistantResponse += chunkValue;
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: assistantResponse,
    };
    setMessages((messages) => [...messages, assistantMessage]);
    if (conversationId) {
      await saveMessageToDatabase(assistantMessage, convoId);
    } else {
      // Handle the case where conversationId is null
      console.error("ConversationId is null");
    }
    
 };

 const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm Chatbot UI, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`
      }
    ]);
 };

 useEffect(() => {
    scrollToBottom();
 }, [messages]);

 useEffect(() => {
    if (!conversationId) {
      setConversationId(generateConversationId());
    }
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm Chatbot UI, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`
      }
    ]);
 }, [conversationId]);
 // Component to display saved conversations


 return (
    <>
      <Head>
        <title>Mindi</title>
        <meta
          name="description"
          content="A simple chatbot starter kit for OpenAI's chat model using Next.js, TypeScript, and Tailwind CSS."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>

      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex justify-center items-center my-4">
          <label htmlFor="toggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input id="toggle" type="checkbox" className="sr-only" checked={currentView === 'History'} onChange={toggleView} />
              <div className="block bg-neutral-200 w-14 h-8 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform" style={{ transform: currentView === 'editor' ? 'translateX(100%)' : '' }}></div>
            </div>
            <div className="ml-3 text-neutral-900 font-semibold">
              Switch to {currentView === 'chat' ? 'History' : 'Chat'}
            </div>
          </label>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
            {currentView === 'chat' ? (
              <Chat
                messages={messages}
                loading={loading}
                onSend={handleSend}
                onReset={handleReset}
              />) : (
                <ConversationsList
                /> 
              )}
              <div ref={messagesEndRef} />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

      