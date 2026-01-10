import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import TurndownService from 'turndown';
import wrapAnsi from 'wrap-ansi';
import chalk from 'chalk';

const turndownService = new TurndownService();
const terminalRenderer = new TerminalRenderer() as any;

terminalRenderer.link = (token: any) => {
    return chalk.blue(`[${token.text}](${token.href})`);
};

export const renderMarkdown = (html: string, width?: number) => {
    const markdown = turndownService.turndown(html);
    marked.setOptions({ renderer: terminalRenderer });
    let result = marked(markdown) as string;
    if (width) {
        result = wrapAnsi(result, width, { trim: false, hard: true });
    }
    return result;
};
