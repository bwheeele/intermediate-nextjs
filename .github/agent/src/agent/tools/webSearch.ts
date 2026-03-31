import { tool } from 'ai';
import { z } from 'zod';
import shell from 'shelljs';

export const webSearch = tool({
  description: 'Search the web for information about a package, changelog, CVE, or anything else.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    const encoded = encodeURIComponent(query);
    const url = 'https://api.duckduckgo.com/?q=' + encoded + '&format=json&no_html=1&skip_disambig=1';
    const result = shell.exec('curl -s ' + JSON.stringify(url), { silent: true });
    if (result.code !== 0) return 'Search failed: ' + result.stderr;
    try {
      const data = JSON.parse(result.stdout);
      const parts = [];
      if (data.AbstractText) parts.push(data.AbstractText);
      if (data.AbstractURL) parts.push('Source: ' + data.AbstractURL);
      if (data.RelatedTopics && data.RelatedTopics.length) {
        const topics = data.RelatedTopics.slice(0, 5).filter(function(t) { return t.Text; }).map(function(t) { return '- ' + t.Text; });
        if (topics.length) parts.push('Related:\n' + topics.join('\n'));
      }
      return parts.length ? parts.join('\n\n') : 'No results found for: ' + query;
    } catch (e) {
      return result.stdout.slice(0, 1000) || 'No results found';
    }
  },
});
