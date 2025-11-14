import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';

interface ChatLogProps {
  messages: Message[];
}

const ChatLog: React.FC<ChatLogProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const renderTextWithLinks = (text: string) => {
    // Regex to find markdown links [title](url) and standalone https URLs
    const linkRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+))/g;
    const parts = text.split(linkRegex);

    return parts.map((part, i) => {
      if (!part) return null;
      
      // Check if it's a markdown link part
      const markdownMatch = part.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      if (markdownMatch) {
        const title = markdownMatch[1];
        const url = markdownMatch[2];
        return (
          <a href={url} key={i} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            {title}
          </a>
        );
      }

      // Check if it's a standalone URL
      if (part.startsWith('http')) {
        return (
          <a href={part} key={i} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            {part}
          </a>
        );
      }
      
      // It's a regular text part
      return part;
    });
  };


  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow-md ${
              message.sender === 'user'
                ? 'bg-cyan-800/50 border border-cyan-600 text-cyan-100 rounded-br-none'
                : 'bg-gray-800/50 border border-gray-600 text-cyan-200 rounded-bl-none'
            }`}
          >
            <p className="whitespace-pre-wrap">{renderTextWithLinks(message.text)}</p>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatLog;
