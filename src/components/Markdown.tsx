import React, { useMemo } from 'react';
import { Text } from 'ink';
import sliceAnsi from 'slice-ansi';
import chalk from 'chalk';
import { log } from '../debug.js';
import { renderMarkdown } from '../utils.js';

interface MarkdownProps {
  children: string;
  offset?: number;
  limit?: number;
  scrollLeft?: number;
  width?: number;
  cursorLine?: number;
  cursorCol?: number;
  onParsedLines?: (lines: string[]) => void;
}

export const Markdown: React.FC<MarkdownProps> = ({ children, offset = 0, limit, scrollLeft = 0, width, cursorLine, cursorCol, onParsedLines }) => {
  const content = useMemo(() => {
    try {
      let result = renderMarkdown(children, width);

      const fullLines = result.split('\n');
      let visibleLines = [...fullLines];
      
      log(`Total lines: ${fullLines.length}`);

      if (onParsedLines) {
          setTimeout(() => onParsedLines(fullLines), 0);
      }

      // Apply cursor if it exists and is within range
      if (cursorLine !== undefined && cursorCol !== undefined && visibleLines[cursorLine]) {
          const line = visibleLines[cursorLine];
          // We assume cursorCol is visual index.
          const before = sliceAnsi(line, 0, cursorCol);
          const char = sliceAnsi(line, cursorCol, cursorCol + 1) || ' '; // Default to space if EOL
          const after = sliceAnsi(line, cursorCol + 1);
          
          visibleLines[cursorLine] = before + chalk.inverse(char) + after;
      }
      
      if (limit !== undefined) {
        visibleLines = visibleLines.slice(offset, offset + limit);
      }

      // Horizontal scrolling logic
      if (scrollLeft > 0 || width) {
         visibleLines = visibleLines.map(line => {
             const sliceEnd = width ? scrollLeft + width : undefined;
             try {
                return sliceAnsi(line, scrollLeft, sliceEnd);
             } catch (err) {
                 log(`sliceAnsi error: ${err}`);
                 return line;
             }
         });
      }

      return visibleLines.join('\n');
    } catch (e) {
      log(`Render error: ${e}`);
      return 'Error rendering markdown: ' + (e as Error).message;
    }
  }, [children, offset, limit, onParsedLines, scrollLeft, width, cursorLine, cursorCol]);

  return <Text>{content}</Text>;
};