import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp, useStdout } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import stripAnsi from 'strip-ansi';
import open from 'open';
import { Markdown } from './components/Markdown.js';
import { fetchDocuments, fetchDocumentContent, updateDocumentLocation, deleteDocument, Document, saveToken } from './api.js';
import { log } from './debug.js';
import { renderMarkdown } from './utils.js';

const Indicator = ({ isSelected }: { isSelected?: boolean }) => (
    <Box marginRight={1}>
        <Text color="cyan">{isSelected ? '❯' : ' '}</Text>
    </Box>
);

const Item = ({ isSelected, label }: { isSelected?: boolean; label: string }) => (
    <Text color={isSelected ? 'cyan' : undefined}>{label}</Text>
);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [view, setView] = useState<'list' | 'reader' | 'menu' | 'open-menu'>('list');
  const [error, setError] = useState<string | null>(null);
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [termHeight, setTermHeight] = useState(stdout?.rows || 24);
  const [termWidth, setTermWidth] = useState(stdout?.columns || 80);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [cursorLine, setCursorLine] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);
  const [parsedLines, setParsedLines] = useState<string[]>([]);
  const [jumpBuffer, setJumpBuffer] = useState('');
  const [detectedLinks, setDetectedLinks] = useState<{ label: string, url: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const totalLines = parsedLines.length;

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => {
        setTermHeight(stdout.rows);
        setTermWidth(stdout.columns);
    };
    stdout.on('resize', onResize);
    setTermHeight(stdout.rows);
    setTermWidth(stdout.columns);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const docs = await fetchDocuments('new');
      setDocuments(docs);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }
    if (view === 'reader') {
        const readerBodyHeight = Math.max(5, termHeight - 12);
        const readerBodyWidth = Math.max(10, termWidth - 4);

        if (key.escape || key.leftArrow) {
            setView('list');
            setSelectedDoc(null);
            setJumpBuffer('');
            setScrollTop(0);
            setScrollLeft(0);
            setCursorLine(0);
            setCursorCol(0);
            return; // Return early to avoid other handlers
        }
        
        // Handle numeric input for jump buffer
        if (/^\d$/.test(input)) {
            setJumpBuffer(prev => prev + input);
            return;
        }

        const jumpSize = jumpBuffer ? parseInt(jumpBuffer, 10) : 1;
        const totalLines = parsedLines.length;

        const isWordChar = (char: string) => /[a-zA-Z0-9_]/.test(char);

        if (input === 'w') {
            let nextLine = cursorLine;
            let nextCol = cursorCol;
            let jumps = jumpSize;

            while (jumps > 0) {
                // Logic to find next word start
                // 1. If we are at EOL, go to next line
                const line = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]) : '';
                
                if (nextCol >= line.length - 1) {
                    if (nextLine < totalLines - 1) {
                        nextLine++;
                        nextCol = 0;
                        // Skip leading whitespace/non-word on next line?
                        // Vim 'w' stops at first word char on next line usually
                        const newLine = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]) : '';
                        while (nextCol < newLine.length && !isWordChar(newLine[nextCol])) {
                            nextCol++;
                        }
                    } else {
                        break; // End of doc
                    }
                } else {
                    // 2. Scan forward on current line
                    // If we are on a word char, consume word
                    if (isWordChar(line[nextCol])) {
                         while (nextCol < line.length && isWordChar(line[nextCol])) nextCol++;
                    }
                    // Consume non-word chars (whitespace/punctuation)
                    while (nextCol < line.length && !isWordChar(line[nextCol])) nextCol++;
                    
                    // If we hit EOL, loop will handle it in next iteration (or we can jump to next line here)
                    if (nextCol >= line.length) {
                         // We consumed the rest of the line without finding a word start.
                         // Loop again will handle "nextCol >= line.length - 1" logic (actually we are AT length)
                         // But we need to decrement jumps ONLY if we found a word.
                         // Actually Vim 'w' counts "words jumped".
                         continue; 
                    }
                }
                jumps--;
            }
            
            // Apply updates
            setCursorLine(nextLine);
            setCursorCol(nextCol);
            
            // Scroll logic
            const halfHeight = Math.floor(readerBodyHeight / 2);
            if (nextLine > halfHeight) {
                 const targetScrollTop = nextLine - halfHeight;
                 setScrollTop(Math.min(targetScrollTop, Math.max(0, totalLines - readerBodyHeight)));
            }
             if (nextCol >= scrollLeft + readerBodyWidth) {
                setScrollLeft(nextCol - readerBodyWidth + 1);
            }
            setJumpBuffer('');
        }

        if (input === 'b') {
             let nextLine = cursorLine;
            let nextCol = cursorCol;
            let jumps = jumpSize;

            while (jumps > 0) {
                 // Logic to find prev word start
                 const line = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]) : '';
                 
                 if (nextCol <= 0) {
                     if (nextLine > 0) {
                         nextLine--;
                         const prevLine = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]) : '';
                         nextCol = Math.max(0, prevLine.length - 1);
                         // We are at end of prev line. Logic below will scan back.
                     } else {
                         break; // Start of doc
                     }
                 }
                 
                 // Current line (re-fetch in case we moved lines)
                 const currLine = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]) : '';
                 
                 // If we are currently at start of word, we need to move back first
                 // Or if we are in whitespace.
                 
                 // 1. Move back while current is whitespace/non-word (and not at 0)
                 // BUT Vim 'b':
                 // If in middle of word, go to start.
                 // If at start, go to start of prev word.
                 
                 // Check if we are at start of word?
                 // Start of word = (col > 0 && !isWordChar(col-1) && isWordChar(col)) OR (col=0 && isWordChar(col))
                 
                 // Decrement at least once to ensure we move?
                 if (nextCol > 0) nextCol--;
                 
                 // Skip non-word chars going back
                 while (nextCol > 0 && !isWordChar(currLine[nextCol])) nextCol--;
                 
                 // Now we are on a word char (or at 0).
                 // Scan back to start of this word.
                 while (nextCol > 0 && isWordChar(currLine[nextCol - 1])) nextCol--;
                 
                 jumps--;
            }

            setCursorLine(nextLine);
            setCursorCol(nextCol);
            
             // Scroll logic
            const halfHeight = Math.floor(readerBodyHeight / 2);
            if (nextLine < totalLines - halfHeight) {
                const targetScrollTop = Math.max(0, nextLine - halfHeight);
                setScrollTop(targetScrollTop);
            }
             if (nextCol < scrollLeft) {
                setScrollLeft(nextCol);
            }
            setJumpBuffer('');
        }

        if (input === 'j' || key.downArrow) {
            const nextLine = Math.min(cursorLine + jumpSize, Math.max(0, totalLines - 1));
            setCursorLine(nextLine);
            
            // Reset col if line is shorter? Or keep strictly visual?
            // Usually Vim keeps col but clamps to length.
            const lineLen = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]).length : 0;
            if (cursorCol > lineLen) setCursorCol(Math.max(0, lineLen - 1));

            // Keep cursor centered vertically
            const halfHeight = Math.floor(readerBodyHeight / 2);
            if (nextLine > halfHeight) {
                 const targetScrollTop = nextLine - halfHeight;
                 setScrollTop(Math.min(targetScrollTop, Math.max(0, totalLines - readerBodyHeight)));
            }
            setJumpBuffer('');
        }
        if (input === 'k' || key.upArrow) {
            const nextLine = Math.max(0, cursorLine - jumpSize);
            setCursorLine(nextLine);
            
            const lineLen = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]).length : 0;
            if (cursorCol > lineLen) setCursorCol(Math.max(0, lineLen - 1));

            // Keep cursor centered vertically
            const halfHeight = Math.floor(readerBodyHeight / 2);
            if (nextLine < totalLines - halfHeight) {
                const targetScrollTop = Math.max(0, nextLine - halfHeight);
                setScrollTop(targetScrollTop);
            }
            setJumpBuffer('');
        }
        if (input === 'l' || key.rightArrow) {
            let nextCol = cursorCol + jumpSize;
            let nextLine = cursorLine;
            
            const currentLineLen = parsedLines[cursorLine] ? stripAnsi(parsedLines[cursorLine]).length : 0;
            
            // Wrap to next line if past end
            if (nextCol >= currentLineLen && nextLine < totalLines - 1) {
                nextLine++;
                nextCol = 0; // Start of next line
                
                // Update scroll if needed for new line
                const halfHeight = Math.floor(readerBodyHeight / 2);
                if (nextLine > halfHeight) {
                    const targetScrollTop = nextLine - halfHeight;
                    setScrollTop(Math.min(targetScrollTop, Math.max(0, totalLines - readerBodyHeight)));
                }
            } else {
                 nextCol = Math.min(nextCol, Math.max(0, currentLineLen - 1));
            }

            setCursorLine(nextLine);
            setCursorCol(nextCol);
            
            // Horizontal scroll follow (less critical with wrapping but good for wide content)
            if (nextCol >= scrollLeft + readerBodyWidth) {
                setScrollLeft(nextCol - readerBodyWidth + 1);
            }
            setJumpBuffer('');
        }
        if (input === 'h') {
            let nextCol = cursorCol - jumpSize;
            let nextLine = cursorLine;

            if (nextCol < 0 && nextLine > 0) {
                nextLine--;
                const prevLineLen = parsedLines[nextLine] ? stripAnsi(parsedLines[nextLine]).length : 0;
                nextCol = Math.max(0, prevLineLen - 1);
                
                // Update scroll if needed
                const halfHeight = Math.floor(readerBodyHeight / 2);
                if (nextLine < totalLines - halfHeight) {
                    const targetScrollTop = Math.max(0, nextLine - halfHeight);
                    setScrollTop(targetScrollTop);
                }
            } else {
                nextCol = Math.max(0, nextCol);
            }

            setCursorLine(nextLine);
            setCursorCol(nextCol);

            // Scroll follow left
            if (nextCol < scrollLeft) {
                setScrollLeft(nextCol);
            }
            setJumpBuffer('');
        }
        if (input === 'g') {
             setCursorLine(0);
             setScrollTop(0);
             setJumpBuffer('');
        }
        if (input === 'G') {
             const lastLine = Math.max(0, totalLines - 1);
             setCursorLine(lastLine);
             setScrollTop(Math.max(0, totalLines - readerBodyHeight));
             setJumpBuffer('');
        }
        
        // Clear buffer on other non-numeric keys if not used
        if (!/^\d$/.test(input) && !['j', 'k', 'l', 'h', 'g', 'G'].includes(input) && !key.downArrow && !key.upArrow && !key.leftArrow && !key.rightArrow) {
             setJumpBuffer('');
        }

        if (input === 'M') {
            setView('menu');
        }

        if (input === 'O') {
            if (selectedDoc) {
                const line = parsedLines[cursorLine] ? stripAnsi(parsedLines[cursorLine]) : '';
                // Regex for [text](url) or just url
                const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
                let match;
                const links: { label: string, url: string }[] = [];
                while ((match = linkRegex.exec(line)) !== null) {
                    const start = match.index;
                    const end = start + match[0].length;
                    if (cursorCol >= start && cursorCol <= end) {
                        if (match[1] && match[2]) {
                            links.push({ label: match[1], url: match[2] });
                        } else if (match[3]) {
                            links.push({ label: match[3], url: match[3] });
                        }
                    }
                }

                if (links.length > 0) {
                    setDetectedLinks(links);
                    setView('open-menu');
                } else {
                    open(selectedDoc.source_url);
                }
            }
        }
    }
    
    if (view === 'menu' || view === 'open-menu') {
        if (input === 'q' || key.escape) {
            setView('reader');
        }
        if (view === 'menu') {
            if (input === 'a' || input === 'A') {
                handleMenuSelect({ value: 'archive' });
            } else if (input === 'd' || input === 'D') {
                handleMenuSelect({ value: 'delete' });
            } else if (input === 'l' || input === 'L') {
                handleMenuSelect({ value: 'later' });
            }
        }
    }

    if (view === 'list') {
        if (input === 'r') {
            loadDocs();
        }
        if (input === 'j' || key.downArrow) {
            setSelectedIndex(prev => Math.min(prev + 1, documents.length - 1));
        }
        if (input === 'k' || key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        }
        if (input === 'g') {
            setSelectedIndex(0);
        }
        if (input === 'G') {
            setSelectedIndex(Math.max(0, documents.length - 1));
        }
        if (key.return) {
            if (documents[selectedIndex]) {
                handleSelect({ value: documents[selectedIndex].id });
            }
        }
    }
  });

  const handleSelect = async (item: { value: string }) => {
    setLoading(true);
    setScrollTop(0);
    setScrollLeft(0);
    setCursorLine(0);
    setCursorCol(0);
    try {
      const doc = await fetchDocumentContent(item.value);
      setSelectedDoc(doc);
      setView('reader');
      // Mark as seen (fire and forget)
      updateDocumentLocation(item.value, 'feed').catch(err => log(`Failed to mark seen: ${err}`));
    } catch (e: any) {
      setError('Failed to load document content');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = async (item: { value: string }) => {
      if (!selectedDoc) return;
      setLoading(true);
      try {
          if (item.value === 'later') {
              await updateDocumentLocation(selectedDoc.id, 'later');
          } else if (item.value === 'archive') {
              await updateDocumentLocation(selectedDoc.id, 'archive');
          } else if (item.value === 'delete') {
              await deleteDocument(selectedDoc.id);
          }
          setView('list');
          setSelectedDoc(null);
          loadDocs();
      } catch (e: any) {
          setError(`Action failed: ${e.message}`);
          setView('list');
      } finally {
          setLoading(false);
      }
  };

  const handleOpenMenuSelect = async (item: { value: string }) => {
      await open(item.value);
      setView('reader');
  };

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text>Check your Readwise token or run './wisereader config' to set it.</Text>
        <Text color="gray">Press 'q' to quit</Text>
      </Box>
    );
  }

  if (loading && view === 'list') {
    return (
      <Box padding={1}>
        <Text color="yellow">
          <Spinner type="dots" /> Loading your Inbox...
        </Text>
      </Box>
    );
  }

  if (view === 'reader' && selectedDoc) {
    const readerBodyHeight = Math.max(5, termHeight - 12); // Adjust for header/footer
    const readerBodyWidth = Math.max(10, termWidth - 4);
    const totalLines = parsedLines.length;
    
    log(`Render Reader: cursor=${cursorLine}, scroll=${scrollTop}, total=${totalLines}, height=${readerBodyHeight}, bodyWidth=${readerBodyWidth}`);

    const percent = totalLines > 0 ? Math.min(100, Math.round(((cursorLine + 1) / totalLines) * 100)) : 0;
    
    return (
      <Box flexDirection="column" padding={1} height={termHeight}>
        <Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1} flexShrink={0}>
          <Text bold italic color="cyan">{selectedDoc.title}</Text>
          <Text color="gray"> by {selectedDoc.author || 'Unknown'}</Text>
        </Box>
        
        {loading ? (
            <Text color="yellow"><Spinner type="dots" /> Fetching content...</Text>
        ) : (
            <Box flexDirection="column" flexGrow={1}>
                {/* @ts-ignore */}
                <Markdown offset={scrollTop} limit={readerBodyHeight} scrollLeft={scrollLeft} width={readerBodyWidth} cursorLine={cursorLine} cursorCol={cursorCol} onParsedLines={setParsedLines}>
                    {selectedDoc.html_content || 'No content available.'}
                </Markdown>
                <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0} flexDirection="row" justifyContent="space-between">
                    <Text color="gray"> [M] Move article | [O] Open link | [Esc] Back | [h/j/k/l/w/b] Move | [q] Quit </Text>
                    <Text color="cyan"> Ln {cursorLine + 1}/{totalLines} ({percent}%) Col {cursorCol + 1} </Text>
                </Box>
            </Box>
        )}
      </Box>
    );
  }

  if (view === 'menu') {
      const menuItems = [
          { label: 'Move to Later', value: 'later' },
          { label: 'Move to Archive', value: 'archive' },
          { label: 'Delete', value: 'delete' }
      ];
      
      return (
        <Box flexDirection="column" padding={1} height={termHeight}>
            <Box marginBottom={1}>
                <Text bold backgroundColor="cyan" color="white"> Actions for "{selectedDoc?.title}" </Text>
            </Box>
            <SelectInput items={menuItems} onSelect={handleMenuSelect} indicatorComponent={Indicator} itemComponent={Item} />
            <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
                <Text color="gray"> [a] Archive | [l] Later | [d] Delete | [q/Esc] Cancel </Text>
            </Box>
        </Box>
      );
  }

  if (view === 'open-menu') {
      const menuItems = [
          { label: `Source: ${selectedDoc?.source_url}`, value: selectedDoc?.source_url || '' },
          ...detectedLinks.map(link => ({ label: `Link: ${link.label} (${link.url})`, value: link.url }))
      ];

      return (
        <Box flexDirection="column" padding={1} height={termHeight}>
            <Box marginBottom={1}>
                <Text bold backgroundColor="cyan" color="white"> Open Link </Text>
            </Box>
            <SelectInput items={menuItems} onSelect={handleOpenMenuSelect} indicatorComponent={Indicator} itemComponent={Item} />
            <Box marginTop={1}>
                <Text color="gray"> [q/Esc] Cancel </Text>
            </Box>
        </Box>
      );
  }

  const items = documents.map(doc => {
    const title = doc.title || 'Untitled';
    const truncated = title.length > 75 ? title.substring(0, 72) + '...' : title;
    return {
      label: truncated,
      value: doc.id
    };
  });

  const listHeight = Math.max(3, termHeight - 6);
  const listScrollTop = Math.max(0, Math.min(selectedIndex - Math.floor(listHeight / 2), Math.max(0, items.length - listHeight)));

  return (
    <Box flexDirection="column" padding={1} height={termHeight}>
      <Box marginBottom={1}>
        <Text bold backgroundColor="cyan" color="white"> WiseReader Inbox </Text>
        <Text color="gray"> ({documents.length} items) </Text>
      </Box>
      
      {items.length === 0 ? (
          <Text italic color="gray">Your inbox is empty!</Text>
      ) : (
          <Box flexDirection="column">
              {items.slice(listScrollTop, listScrollTop + listHeight).map((item, index) => {
                  const absoluteIndex = index + listScrollTop;
                  const isSelected = absoluteIndex === selectedIndex;
                  return (
                      <Box key={item.value}>
                          <Indicator isSelected={isSelected} />
                          <Item isSelected={isSelected} label={item.label} />
                      </Box>
                  );
              })}
          </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray"> [r] Refresh | [j/k] Navigate | [Enter] Open | [q] Quit </Text>
      </Box>
    </Box>
  );
};

const Config = () => {
    const [token, setToken] = useState('');
    const { exit } = useApp();

    const handleSubmit = (val: string) => {
        saveToken(val);
        exit();
    };

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold color="cyan">WiseReader Configuration</Text>
            <Box marginTop={1}>
                <Text>Enter your Readwise Access Token: </Text>
                <TextInput value={token} onChange={setToken} onSubmit={handleSubmit} />
            </Box>
            <Text color="gray" marginTop={1}>Find your token at: https://readwise.io/access_token</Text>
            <Text color="gray">Press Enter to save and exit</Text>
        </Box>
    );
};

const handleCLI = async () => {
    const args = process.argv.slice(2);
    
    if (args.includes('-h') || args.includes('--help')) {
        console.log(`
WiseReader - minimalist, Vim-inspired CLI client for Readwise Reader.

Usage:
  wisereader [command]

Commands:
  (none)         Start interactive TUI inbox browser
  config         Prompt for and save Readwise Access Token
  -r             Read next unseen article, mark as seen, and print ID
  -m <action> <id> Move or delete article by ID
                 Actions: archive, later, delete
  -d <id>        Quick alias for -m delete <id>
  -h, --help     Show this help
        `);
        process.exit(0);
    }

    if (args.includes('-d')) {
        const dIndex = args.indexOf('-d');
        const id = args[dIndex + 1];
        if (!id) {
            console.error('Usage: wisereader -d <id>');
            process.exit(1);
        }
        try {
            await deleteDocument(id);
            console.log(`Deleted article with ID: ${id}`);
            process.exit(0);
        } catch (e: any) {
            console.error(`Error: ${e.message}`);
            process.exit(1);
        }
    }

    if (args.includes('-r')) {
        try {
            const docs = await fetchDocuments('new', 1);
            const docSummary = docs[0];
            if (!docSummary) {
                console.error(`No new articles found.`);
                process.exit(1);
            }
            
            const doc = await fetchDocumentContent(docSummary.id);
            const content = renderMarkdown(doc.html_content || 'No content', process.stdout.columns);
            console.log(content);
            
            // Mark as seen
            await updateDocumentLocation(doc.id, 'feed');
            
            console.log(`\nURL: ${doc.source_url}`);
            console.log(`ID: ${doc.id}`);
            process.exit(0);
        } catch (e: any) {
            console.error(`Error: ${e.message}`);
            process.exit(1);
        }
    }
    
    if (args.includes('-m')) {
        const mIndex = args.indexOf('-m');
        const action = args[mIndex + 1];
        const id = args[mIndex + 2];
        
        if (!action || !id) {
            console.error('Usage: wisereader -m <later|archive|delete> <id>');
            process.exit(1);
        }
        
        try {
            if (action === 'later') {
                await updateDocumentLocation(id, 'later');
            } else if (action === 'archive') {
                await updateDocumentLocation(id, 'archive');
            } else if (action === 'delete') {
                await deleteDocument(id);
            } else {
                console.error(`Unknown action: ${action}`);
                process.exit(1);
            }
            console.log(`Action ${action} completed for ID: ${id}`);
            process.exit(0);
        } catch (e: any) {
            console.error(`Error: ${e.message}`);
            process.exit(1);
        }
    }
};

const Main = () => {
    return process.argv.includes('config') ? <Config /> : <App />;
};

const run = async () => {
    const isCLI = process.argv.some(arg => ['-r', '-m', '-d', '-h', '--help'].includes(arg));
    if (isCLI) {
        await handleCLI();
    } else {
        render(<Main />);
    }
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});