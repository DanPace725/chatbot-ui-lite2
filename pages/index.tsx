// pages/index.tsx
import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
 const [messages, setMessages] = useState<Message[]>([]);
 const [loading, setLoading] = useState<boolean>(false);
 const [conversationId, setConversationId] = useState<string | null>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);


 function generateConversationId() {
  return uuidv4(); // This function generates a unique UUID
}

useEffect(() => {
  // Generate a new conversation ID when the component mounts (or chat session starts)
  setConversationId(uuidv4());
}, []); // Empty dependency array ensures this effect runs only once on mount

 const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 };

 const saveMessageToDatabase = async (message: Message, conversationId: string) => {
    const { data, error } = await supabase.from("messages").insert([
      {
        content: message.content,
        role: message.role,
        conversation_id: conversationId,
        
      },
    ]);

    if (error) {
      console.error("Error saving message to database", error);
    }
 };

 const handleSend = async (message: Message) => {
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    
    // Check if conversationId is not null before calling saveMessageToDatabase
   if (conversationId) {
    await saveMessageToDatabase(message, conversationId);
  } else {
    // Handle the case where conversationId is null
    console.error("ConversationId is null");
  }

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
      await saveMessageToDatabase(assistantMessage, conversationId);
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

 return (
    <>
      <Head>
        <title>Chatbot UI</title>
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

        <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
          <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
            <Chat
              messages={messages}
              loading={loading}
              onSend={handleSend}
              onReset={handleReset}
            />
            <div ref={messagesEndRef} />
          </div>
        </div>
        <Footer />
      </div>
    </>
 );
}
