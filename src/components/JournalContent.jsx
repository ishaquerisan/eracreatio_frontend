import React from 'react';
import DOMPurify from 'dompurify';

function isHtmlContent(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
}

function hasMeaningfulSanitizedHtml(value) {
  const html = String(value || '');

  if (!html.trim()) {
    return false;
  }

  if (/<(img|video|iframe)\b/i.test(html)) {
    return true;
  }

  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  return plainText.length > 0;
}

function parseJournalContent(content) {
  const lines = String(content || '').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({
        type: 'h2',
        text: line.slice(3).trim(),
      });
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({
        type: 'h3',
        text: line.slice(4).trim(),
      });
      index += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push({
        type: 'quote',
        text: line.slice(2).trim(),
      });
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items = [];

      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraphParts = [line];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index].trim();

      if (!nextLine || nextLine.startsWith('## ') || nextLine.startsWith('### ') || nextLine.startsWith('> ') || nextLine.startsWith('- ')) {
        break;
      }

      paragraphParts.push(nextLine);
      index += 1;
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphParts.join(' '),
    });
  }

  return blocks;
}

const JournalContent = ({ content, className = '' }) => {
  const safeContent = String(content || '').trim();

  if (!safeContent) {
    return null;
  }

  if (isHtmlContent(safeContent)) {
    const sanitizedHtml = DOMPurify.sanitize(safeContent, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'script'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
    });

    if (!hasMeaningfulSanitizedHtml(sanitizedHtml)) {
      return null;
    }

    return (
      <div
        className={`journal-rich-content ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  const blocks = parseJournalContent(safeContent);

  if (!blocks.length) {
    return null;
  }

  return (
    <div className={`space-y-5 ${className}`.trim()}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'h2') {
          return (
            <h2 key={`h2-${blockIndex}`} className="font-serif text-2xl font-semibold text-primary pt-2">
              {block.text}
            </h2>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3 key={`h3-${blockIndex}`} className="font-serif text-xl font-semibold text-primary pt-1">
              {block.text}
            </h3>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={`quote-${blockIndex}`}
              className="border-l-4 border-accent bg-amber-50 px-5 py-4 text-gray-700 italic leading-7 rounded-r-xl"
            >
              {block.text}
            </blockquote>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={`list-${blockIndex}`} className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
              {block.items.map((item, itemIndex) => (
                <li key={`item-${blockIndex}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`p-${blockIndex}`} className="text-base sm:text-lg text-gray-700 leading-8">
            {block.text}
          </p>
        );
      })}
    </div>
  );
};

export default JournalContent;
