import React from 'react';
import ReactMarkdown from 'react-markdown';

interface JournalNoticeProps {
  content: string;
}

/**
 * Component to parse and style journal notices in chat messages
 * Converts {adding to journal} text into styled notice badges
 */
export const JournalNotice: React.FC<JournalNoticeProps> = ({ content }) => {
  // Parse the content to find journal notices
  const parseContent = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    
    return parts.map((part, index) => {
      // Check if this part is a journal notice
      if (part.match(/^\{adding to journal\}$/i)) {
        return (
          <span key={index} className="journal-notice">
            📝 adding to journal
          </span>
        );
      }
      
      // Check for other potential journal-related notices
      if (part.match(/^\{saved to journal\}$/i)) {
        return (
          <span key={index} className="journal-notice">
            ✅ saved to journal
          </span>
        );
      }
      
      if (part.match(/^\{journal updated\}$/i)) {
        return (
          <span key={index} className="journal-notice">
            🔄 journal updated
          </span>
        );
      }
      
      // Return regular text with markdown support
      return (
        <span key={index}>
          <ReactMarkdown>{part}</ReactMarkdown>
        </span>
      );
    });
  };

  return <>{parseContent(content)}</>;
};

export default JournalNotice; 