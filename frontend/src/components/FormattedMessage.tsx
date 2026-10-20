import React from 'react';

interface FormattedMessageProps {
  content: string;
  role?: 'user' | 'assistant' | 'system';
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  role = 'assistant',
  className = ''
}) => {
  if (!content) return null;

  const isUser = role === 'user';

  // Helper to format inline markdown (turn asterisks into bold, handle inline code, remove stray asterisks)
  const renderInline = (text: string) => {
    // Matches ***text***, **text**, *text*, or `code`
    const regex = /(\*{1,3}[^*]+?\*{1,3}|`[^`]+?`)/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Asterisk wrapped text: remove asterisks and render as bold
      if (/^\*{1,3}[^*]+?\*{1,3}$/.test(part)) {
        const cleanText = part.replace(/^\*+/, '').replace(/\*+$/, '').trim();
        return (
          <strong
            key={idx}
            className={`font-bold ${isUser ? 'text-blue-950' : 'text-[#1E293B]'}`}
          >
            {cleanText}
          </strong>
        );
      }

      // Inline code wrapped with backticks
      if (/^`[^`]+?`$/.test(part)) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={idx}
            className="bg-black/5 text-[#0F172A] px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono"
          >
            {codeText}
          </code>
        );
      }

      // Normal text: strip any remaining lone asterisks so none appear
      const cleanedText = part.replace(/\*/g, '');
      return <span key={idx}>{cleanedText}</span>;
    });
  };

  // Split lines to handle markdown blocks (headings, bullet lists, numbered lists, empty lines)
  const lines = content.split('\n');

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Empty line -> spacing
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Markdown headings: ### Title or ## Title or # Title
        const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <div
              key={lineIdx}
              className={`font-bold text-sm sm:text-base mt-2.5 mb-1 ${
                isUser ? 'text-blue-950' : 'text-[#1E293B]'
              }`}
            >
              {renderInline(headingMatch[1])}
            </div>
          );
        }

        // Bullet lists: * Item or - Item or • Item
        const bulletMatch = line.match(/^(\s*)(?:[*-]|\u2022)\s+(.+)$/);
        if (bulletMatch) {
          const hasIndent = bulletMatch[1].length > 0;
          return (
            <div
              key={lineIdx}
              className={`flex items-start space-x-2 my-0.5 ${hasIndent ? 'ml-4' : 'ml-1'}`}
            >
              <span className="text-[#2E8B57] font-bold select-none text-xs leading-5 shrink-0">
                •
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInline(bulletMatch[2])}
              </div>
            </div>
          );
        }

        // Numbered lists: 1. Item, 2. Item
        const numberedMatch = line.match(/^(\s*)(\d+\.)\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div
              key={lineIdx}
              className="flex items-start space-x-1.5 my-0.5 ml-1"
            >
              <span className="font-semibold text-[#2E8B57] select-none text-xs leading-5 shrink-0">
                {numberedMatch[2]}
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInline(numberedMatch[3])}
              </div>
            </div>
          );
        }

        // Standard text line
        return (
          <div key={lineIdx} className="leading-relaxed">
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
};
