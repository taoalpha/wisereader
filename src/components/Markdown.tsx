import React, { useMemo } from 'react';
import { Text } from 'ink';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import TurndownService from 'turndown';
import sliceAnsi from 'slice-ansi';
import wrapAnsi from 'wrap-ansi';
import chalk from 'chalk';
import { log } from '../debug.js';

// Configure marked with the terminal renderer
const renderer = new TerminalRenderer() as any;
const originalLink = renderer.link.bind(renderer);

renderer.link = (token: any) => {
    // Return a format that is easy to regex but still looks okay
    // We use blue for the link to keep the TUI feel
    return chalk.blue(`[${token.text}](${token.href})`);
};

marked.setOptions({ renderer });

const turndownService = new TurndownService();

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
      // Convert HTML to Markdown first
      const markdown = turndownService.turndown(children);
      
      // marked can return a string or a Promise.
      // We assume synchronous here as we aren't using async extensions.
      let result = marked(markdown) as string;
      
      // Wrap lines if width is provided
      if (width) {
          result = wrapAnsi(result, width, { trim: false, hard: true });
      }

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
          // We need to slice line into: [0...col] + [col] + [col+1...]
          // sliceAnsi handles ANSI codes correctly.
          const before = sliceAnsi(line, 0, cursorCol);
          const char = sliceAnsi(line, cursorCol, cursorCol + 1) || ' '; // Default to space if EOL
          const after = sliceAnsi(line, cursorCol + 1);
          
          visibleLines[cursorLine] = before + chalk.inverse(char) + after;
      }
      
      if (limit !== undefined) {
        visibleLines = visibleLines.slice(offset, offset + limit);
      }

      // Horizontal scrolling logic (now mostly visual if cursor moves viewport)
      // But we still might want to offset the whole view if scrollLeft is set.
      if (scrollLeft > 0 || width) {
         // log(`Slicing with scrollLeft: ${scrollLeft}, width: ${width}`);
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