import { tool } from "ai";
import { z } from "zod";
import shell from "shelljs";

export const runCommand = tool({
  description: `Execute a shel or terminal command and return it's output. Use this for system operations, running scripts or interacting with the OS`,
  inputSchema: z.object({
    command: z.string().describe("The shell command to execute"),
  }),
  execute: async ({ command }) => {
    const result = shell.exec(command, { silent: true });

    let output = "";

    if (result.stdout) {
      output += result.stdout;
    }

    if (result.stderr) {
      output += result.stderr;
    }

    if (result.code !== 0) {
      return `Command failed with code ${result.code}: ${output}`;
    }

    return output || "Command completed successfully (no output)";
  },
});
