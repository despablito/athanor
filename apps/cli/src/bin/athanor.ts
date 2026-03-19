#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "../commands/init.js";
import { importCommand } from "../commands/import.js";
import { validateCommand } from "../commands/validate.js";
import { statsCommand } from "../commands/stats.js";
import { exportCommand } from "../commands/export.js";
import { dbCommand } from "../commands/db.js";
import { extractCommand } from "../commands/extract.js";
import { metaGenerateCommand } from "../commands/meta-generate.js";
import { clonePromptCommand } from "../commands/clone-prompt.js";
import { embedCommand } from "../commands/embed.js";
import { exploreCommand } from "../commands/explore.js";
import { serveCommand } from "../commands/serve.js";
import { mcpCommand } from "../commands/mcp.js";
import { interviewCommand } from "../commands/interview.js";
import { secondOrderCommand } from "../commands/second-order.js";

const program = new Command();

program
  .name("athanor")
  .description("Athanor — the identity portrait protocol CLI")
  .version("0.0.1");

program.addCommand(initCommand);
program.addCommand(importCommand);
program.addCommand(validateCommand);
program.addCommand(statsCommand);
program.addCommand(exportCommand);
program.addCommand(dbCommand);
program.addCommand(extractCommand);
program.addCommand(metaGenerateCommand);
program.addCommand(clonePromptCommand);
program.addCommand(embedCommand);
program.addCommand(exploreCommand);
program.addCommand(serveCommand);
program.addCommand(mcpCommand);
program.addCommand(interviewCommand);
program.addCommand(secondOrderCommand);

program.parse();
