import { tool } from 'ai';
import { z } from 'zod';
import shell from 'shelljs';

/**
 * Regular executable web search tool using DuckDuckGo instant answer API.
 * No API key required. Replaces the OpenAI provider webSearch tool which
 * is incompatible with the stateless message-history loop we use.
 */
export const webSearch = tool({
  description: 'Search the web for information about a package, changelog, CVE, or anything else. Returns a summary of results.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    const encoded = encodeURIComponent(query);
    const result = shell.exec(
      `curl -s 'https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1'`,
      { silent: true }
    );
    if (result.code !== 0) {
      return `Search failed: ${result.stderr}`;
    }
    try {
      const data = JSON.parse(result.stdout);
      const parts: string[] = [];
      if (data.AbstractText) parts.push(data.AbstractText);
      if (data.AbstractURL) parts.push('Source: ' + data.AbstractURL);
      if (data.RelatedTopics?.length) {
        const topics = data.RelatedTopics
          .slice(0, 5)
          .filter((t: { Text?: string }) => t.Text)
          .map((t: { Text: string }) => '- ' + t.Text);
        if (topics.length) parts.push('Related:
' + topics.join('
'));
      }
      return parts.length ? parts.join('

') : 'No results found for: ' + query;
    } catch {
      return result.stdout.slice(0, 1000) || 'No results found';
    }
  },
});
