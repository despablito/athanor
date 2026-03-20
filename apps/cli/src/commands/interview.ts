import { Command } from "commander";
import { input } from "@inquirer/prompts";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { Interviewer } from "@athanor/interviewer";
import type { InterviewSessionImpl, PhaseId, InterviewMode } from "@athanor/interviewer";
import type { PortraitJSON, Chunk } from "@athanor/core";
import {
  loadPortraitJSON,
  savePortraitJSON,
  resolvePortraitPathForMutatingCommand,
} from "../lib/portrait-io.js";
import { errorBox, successBox, warnBox } from "../lib/ui.js";

/** Recognize skip/done (with or without leading /). Slash+word looks like a path to zsh if typed at the shell by mistake. */
function parseInterviewCommandLine(trimmed: string): "/skip" | "/done" | null {
  const t = trimmed.toLowerCase();
  if (t === "skip" || t === "/skip") return "/skip";
  if (t === "done" || t === "/done") return "/done";
  if (t === "exit" || t === "/exit" || t === "quit" || t === "/quit") {
    return "/done";
  }
  return null;
}

function isInquirerCancel(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "ExitPromptError" ||
      err.message.includes("User force closed"))
  );
}

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
  .description(
    "Guided identity interview: AI asks questions; ends with chunk extraction merged into portrait (use this to grow the graph — unlike `chat`, which is read-only)",
  )
  .option("--mode <mode>", "Interview mode: sync, async, self", "self")
  .option("--phase <phase>", "Phase: all, 0, 1, 2, 3, 4", "all")
  .option("--language <lang>", "Language", "en")
  .option("--provider <p>", "LLM provider: ollama, anthropic, openai", "ollama")
  .option("--model <m>", "Model name")
  .option("--api-key <key>", "API key for the provider")
  .option("--portrait <path>", "Portrait file path", "./portrait.json")
  .option("--state <path>", "Session state file path", "./interview-state.json")
  .action(async (opts: InterviewOpts, cmd: Command) => {
    let portraitPath: string;
    try {
      portraitPath = await resolvePortraitPathForMutatingCommand(opts.portrait, {
        allowWorkspaceExampleFallback: cmd.getOptionValueSource?.("portrait") !== "cli",
      });
    } catch (err) {
      errorBox(
        err instanceof Error ? err.message : String(err),
        "Run 'athanor init <name>' first, or pass --portrait <path>.",
      );
      process.exit(1);
    }

    const statePath = resolve(opts.state);

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
    console.log(
      chalk.dim(
        "  Wait for the “>” prompt after each question (stdin for this program — not your shell).",
      ),
    );
    console.log(
      chalk.dim(
        "  Long answers: type text, then Enter, then a blank line to submit. ",
      ) +
        chalk.dim("End session: ") +
        chalk.cyan("done") +
        chalk.dim(" · skip question: ") +
        chalk.cyan("skip") +
        chalk.dim(" (one line + Enter). "),
    );
    console.log(
      chalk.dim(
        "  Also: /skip /done — ",
      ) +
        chalk.yellow("do not type these at your shell prompt") +
        chalk.dim(
          " (zsh treats /done as a path). Type them only after the ",
        ) +
        chalk.dim("> ") +
        chalk.dim("under a question."),
    );
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
      initialPortrait: portrait,
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
  // Use @inquirer/prompts (same as `athanor chat`) — raw readline often loses stdin under
  // pnpm/tsx/ora and drops straight back to the shell after printing the question.
  const readMultilineAnswer = async (): Promise<string> => {
    let first: string;
    try {
      first = await input({
        message: chalk.bold.cyan("  >"),
      });
    } catch (err) {
      if (isInquirerCancel(err)) return "/done";
      throw err;
    }

    const trimmed = first.trim();
    if (trimmed !== "") {
      const cmd = parseInterviewCommandLine(trimmed);
      if (cmd) return cmd;
    }

    const lines: string[] = [];
    if (first !== "") lines.push(first);

    while (true) {
      let line: string;
      try {
        line = await input({
          message: chalk.dim("   ·"),
        });
      } catch (err) {
        if (isInquirerCancel(err)) {
          return lines.length > 0 ? lines.join("\n") : "/done";
        }
        throw err;
      }
      if (line === "") {
        if (lines.length > 0) break;
        continue;
      }
      lines.push(line);
    }

    return lines.join("\n");
  };

  let questionCount = 0;
  let shouldExit = false;

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

      // Read the answer (prompt drawn by @inquirer `input`, same stack as `athanor chat`)
      const answer = await readMultilineAnswer();

      // Handle commands (skip | done with or without leading /)
      const cmd = parseInterviewCommandLine(answer.trim());
      if (cmd === "/skip") {
        console.log(chalk.dim("  (Skipped)"));
        continue;
      }

      if (cmd === "/done") {
        break;
      }

      if (answer.trim().length < 5) {
        warnBox(
          "Answer too short. Add more detail, or type skip (or /skip) to skip this question.",
        );
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
