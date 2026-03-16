#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("athanor")
  .description("Athanor CLI")
  .version("0.0.1");

program.parse();
