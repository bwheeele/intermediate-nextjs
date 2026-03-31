import { runAgent } from './src/agent/run.ts'
import type { ModelMessage } from 'ai'
import { existsSync, readFileSync } from 'fs'

const prNumber = process.env.PR_NUMBER!
const prBody = process.env.PR_BODY || 'No PR body provided'
const repo = process.env.REPO!
const githubToken = process.env.GITHUB_TOKEN!

const auditOutput = existsSync('../../audit-output.json')
  ? readFileSync('../../audit-output.json', 'utf-8').slice(0, 3000)
  : 'No audit data available'

const userMessage = `
A Renovate bot opened a pull request in the repo ${repo}.

PR Description:
${prBody}

npm audit output:
${auditOutput}

Please do the following in order:

1. Use readFile to read "../../package.json" to identify what dependency changed
2. Use webSearch to find the changelog for that package and version
3. Build a markdown comment with these sections:

## 🔍 Dependency Review
**Package:** <name>
**Version bump:** <old> → <new>

## 🔒 Security
<findings from audit or "No issues found">

## ⚠️ Risk Level
Low / Medium / High — with one sentence reason

## ✅ Suggested Verification
- <step 1>
- <step 2>

---
*Posted by Renovate Agent 🤖*

4. Use runCommand to post that comment to GitHub using this exact single-line curl (replace BODY with your markdown JSON-escaped: newlines become \n, double quotes become \"  — no backslash line continuations):
curl -s -X POST -H "Authorization: Bearer ${githubToken}" -H "Content-Type: application/json" -d '{"body": "BODY"}' https://api.github.com/repos/${repo}/issues/${prNumber}/comments
`

const callbacks = {
  onToken: (t: string) => process.stdout.write(t),
  onToolCallStart: (name: string, args: unknown) =>
    console.log(`\n[Tool] ${name}:`, JSON.stringify(args).slice(0, 150)),
  onToolApproval: async (_name: string, _args: unknown) => true, // auto-approve in CI
  onToolCallEnd: (_name: string, result: string) =>
    console.log(`[Result]:`, String(result).slice(0, 300)),
  onComplete: () => console.log('\n[Agent complete]'),
  onTokenUsage: (usage: unknown) => console.log('[Tokens]', usage),
}

const history: ModelMessage[] = []
await runAgent(userMessage, history, callbacks)
