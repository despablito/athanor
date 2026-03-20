import { Command } from "commander";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import ora from "ora";
import chalk from "chalk";
import { Interviewer } from "@athanor/interviewer";
import type { InterviewSessionImpl, PhaseId, InterviewMode } from "@athanor/interviewer";
import type { PortraitJSON, Chunk } from "@athanor/core";
import { loadPortraitJSON, savePortraitJSON, resolvePortraitPath } from "../lib/portrait-io.js";
import { errorBox, successBox, warnBox } from "../lib/ui.js";

interface InterviewOpts {
  mode: InterviewMode;
  phase: string;
  language: string;
  provider: "ollama" | "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  portrait: string;
  state: string;
}

export const interviewCommand = new Command("interview")
  .description("Run an interactive identity interview session")
  .option("--mode <mode>", "Interview mode: sync, async, self", "self")
  .option("--phase <phase>", "Phase: all, 0, 1, 2, 3, 4", "all")
  .option("--language <lang>", "Language", "en")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .option("--state <path>", "Session state file path", "./interview-state.json")
  .action(async (opts: InterviewOpts) => {
    const portraitPath = resolvePortraitPath(opts.portrait);
    const statePath = resolve(opts.state);

    // Ensure portrait exists
    if (!existsSync(portraitPath)) {
      errorBox(
        `Portrait file not found: ${portraitPath}`,
        "Run 'athanor init <name>' first to create a portrait.",
      );
      process.exit(1);
    }

    const portrait = await loadPortraitJSON(portraitPath);
    const phase = opts.phase === "all" ? "all" : (Number(opts.phase) as PhaseId);

    console.log("");
    console.log(chalk.bold.cyan("  ╔══════════════════════════════════════╗"));
    console.log(chalk.bold.cyan("  ║        Athanor Identity Interview     ║"));
    console.log(chalk.bold.cyan("  ╚══════════════════════════════════════╝"));
    console.log("");
    console.log(`  Subject: ${chalk.bold(portrait.subject.name)}`);
    console.log(`  Mode:    ${chalk.bold(opts.mode)}`);
    console.log(`  Phase:   ${chalk.bold(opts.phase)}`);
    console.log(`  Provider:${chalk.bold(opts.provider)}`);
    console.log("");
    console.log(chalk.dim("  Type your answers. Press Enter twice to submit."));
    console.log(chalk.dim("  Type /skip to skip a question, /done to end the session."));
    console.log(chalk.dim("  ─────────────────────────────────────────────"));
    console.log("");

    // Create interviewer and session
    const interviewer = new Interviewer({
      provider: opts.provider,
      model: opts.model,
      apiKey: opts.apiKey,
      language: opts.language,
    });

    const session = await interviewer.startSession({
      subjectName: portrait.subject.name,
      mode: opts.mode,
      phase,
      portraitPath,
      statePath,
    });

    // Run the interactive loop
    await runInteractiveLoop(session, portrait, portraitPath, statePath);
  });

async function runInteractiveLoop(
  session: InterviewSessionImpl,
  portrait: PortraitJSON,
  portraitPath: string,
  statePath: string,
): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  const readMultilineAnswer = async (): Promise<string> => {
    const lines: string[] = [];
    let emptyLineCount = 0;

    while (true) {
      const line = await ask("");
      if (line === "") {
        emptyLineCount++;
        if (emptyLineCount >= 1 && lines.length > 0) break;
      } else {
        emptyLineCount = 0;
        lines.push(line);
      }
    }

    return lines.join("\n");
  };

  let questionCount = 0;
  let shouldExit = false;

  try {
    while (!session.isComplete() && !shouldExit) {
      // Get next question
      const spinner = ora({ text: "Thinking...", color: "cyan" }).start();
      let question: string;
      try {
        question = await session.nextQuestion();
        spinner.stop();
      } catch (err) {
        spinner.fail("Failed to generate question");
        errorBox(err instanceof Error ? err.message : String(err));
        break;
      }

      questionCount++;

      // Display the question
      console.log("");
      console.log(chalk.cyan.bold(`  Q${questionCount}: `) + chalk.cyan(question));
      console.log("");
      process.stdout.write(chalk.dim("  > "));

      // Read the answer
      const answer = await readMultilineAnswer();

      // Handle commands
      if (answer.trim() === "/skip") {
        console.log(chalk.dim("  (Skipped)"));
        continue;
      }

      if (answer.trim() === "/done") {
        shouldExit = true;
        break;
      }

      if (answer.trim().length < 5) {
        warnBox("Answer too short. Please provide a more detailed response, or type /skip.");
        continue;
      }

      // Submit answer and get analysis
      const spinner2 = ora({ text: "Analyzing...", color: "yellow" }).start();
      try {
        const { analysis } = await session.submitAnswer(answer);
        spinner2.stop();

        // Show feedback
        if (analysis.isShallow) {
          console.log(chalk.yellow("  ↳ Let me dig deeper on that..."));
        } else if (analysis.hasEmotion) {
          console.log(chalk.magenta("  ↳ I noticed something important there..."));
        } else if (analysis.hasContradiction) {
          console.log(chalk.red("  ↳ Interesting tension — let me explore that..."));
        }
      } catch {
        spinner2.stop();
        // Non-fatal — continue the interview even if analysis fails
      }

      // Check phase completion
      if (session.isPhaseComplete()) {
        const nextPhase = session.advancePhase();
        if (nextPhase !== null) {
          console.log("");
          successBox(`Phase ${session.state.currentPhase - 1} complete! Moving to Phase ${nextPhase}...`);
          console.log("");
        } else {
          console.log("");
          successBox("Interview session complete!");
          shouldExit = true;
        }
      }

      // Auto-save state periodically
      if (questionCount % 3 === 0) {
        await session.save();
      }
    }
  } finally {
    rl.close();
  }

  // ─── Post-session processing ─────────────────────────────────────────────

  console.log("");
  console.log(chalk.bold("  ─── Session Summary ───"));
  console.log(`  Questions asked: ${chalk.bold(String(questionCount))}`);
  console.log(`  Turns recorded: ${chalk.bold(String(session.state.turns.length))}`);

  // Save transcript
  const transcript = session.getTranscript();
  const transcriptPath = statePath.replace(/\.json$/, "-transcript.md");
  await writeFile(transcriptPath, transcript, "utf-8");
  successBox(`Transcript saved to ${chalk.dim(transcriptPath)}`);

  // Save session state
  await session.save();
  successBox(`Session state saved to ${chalk.dim(statePath)}`);

  // Extract chunks from transcript
  if (questionCount >= 2) {
    console.log("");
    const extractSpinner = ora("Extracting identity chunks from transcript...").start();

    try {
      const chunks = await session.extractChunks();
      extractSpinner.succeed(`Extracted ${chalk.bold(String(chunks.length))} chunks`);

      if (chunks.length > 0) {
        // Show extracted chunks
        console.log("");
        const preview = chunks.slice(0, 5);
        for (const chunk of preview) {
          console.log(`  ${chalk.cyan(chunk.cluster)}/${chalk.magenta(chunk.type)} [${chunk.uniqueness}]`);
          console.log(`  ${chalk.dim(chunk.content.slice(0, 120))}${chunk.content.length > 120 ? "…" : ""}`);
          console.log("");
        }
        if (chunks.length > 5) {
          console.log(chalk.dim(`  ... and ${chunks.length - 5} more`));
        }

        // Merge into portrait
        const mergeSpinner = ora("Merging chunks into portrait...").start();
        for (const chunk of chunks) {
          portrait.chunks.push({
            chunk_id: `PENDING-${portrait.chunks.length}`,
            author: portrait.subject.name,
            ...chunk,
            linked_chunks: [],
          } as unknown as Chunk);
        }

        const coverage: Record<string, number> = {};
        for (const c of portrait.chunks) {
          coverage[c.cluster] = (coverage[c.cluster] ?? 0) + 1;
        }
        portrait.metadata.chunk_count = portrait.chunks.length;
        portrait.metadata.cluster_coverage = coverage;

        await savePortraitJSON(portraitPath, portrait);
        mergeSpinner.succeed(`Merged ${chunks.length} chunks into portrait (${portrait.chunks.length} total)`);
      }
    } catch (err) {
      extractSpinner.fail("Extraction failed (transcript saved — you can run 'athanor extract' manually)");
      if (err instanceof Error) {
        console.log(chalk.dim(`  ${err.message}`));
      }
    }
  }

  console.log("");
}
