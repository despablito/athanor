import { default as Ajv2020Module } from "ajv/dist/2020.js";
import { default as addFormatsModule } from "ajv-formats";
import type { ErrorObject } from "ajv";
import type { ValidationResult, Chunk, Relation } from "./types.js";
import { RECOMMENDED_CLUSTERS } from "./types.js";

import chunkSchema from "../../../schema/chunk.schema.json" with { type: "json" };
import relationSchema from "../../../schema/relation.schema.json" with { type: "json" };
import portraitSchema from "../../../schema/portrait.schema.json" with { type: "json" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv2020 = (Ajv2020Module as any).default ?? Ajv2020Module;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFormats = (addFormatsModule as any).default ?? addFormatsModule;

function createAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

const ajvSingle = createAjv();
const compiledChunkValidator = ajvSingle.compile(chunkSchema);
const compiledRelationValidator = ajvSingle.compile(relationSchema);

const ajvPortrait = createAjv();
ajvPortrait.addSchema(chunkSchema, "chunk.schema.json");
ajvPortrait.addSchema(relationSchema, "relation.schema.json");
const compiledPortraitValidator = ajvPortrait.compile(portraitSchema);

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors) return [];
  return errors.map((e: ErrorObject) => {
    const path = e.instancePath || "/";
    return `${path}: ${e.message ?? "unknown error"}`;
  });
}

export function validateChunk(data: unknown): ValidationResult {
  const valid = compiledChunkValidator(data);
  const errors = valid ? [] : formatErrors(compiledChunkValidator.errors);
  const warnings: string[] = [];

  if (valid) {
    const chunk = data as unknown as Chunk;
    if (chunk.confidence < 0.3) {
      warnings.push(
        `Chunk ${chunk.chunk_id} has very low confidence (${chunk.confidence}), consider reviewing`,
      );
    }
    if (chunk.content.length < 50) {
      warnings.push(
        `Chunk ${chunk.chunk_id} has short content (${chunk.content.length} chars)`,
      );
    }
  }

  return { valid, errors, warnings };
}

export function validateRelation(data: unknown): ValidationResult {
  const valid = compiledRelationValidator(data);
  const errors = valid
    ? []
    : formatErrors(compiledRelationValidator.errors);
  return { valid, errors, warnings: [] };
}

export function validatePortrait(data: unknown): ValidationResult {
  const valid = compiledPortraitValidator(data);
  const errors = valid
    ? []
    : formatErrors(compiledPortraitValidator.errors);
  const warnings: string[] = [];

  if (valid) {
    const portrait = data as {
      chunks: Chunk[];
      relations: Relation[];
    };
    const { chunks, relations } = portrait;

    // Check CRITICAL ratio
    if (chunks.length > 0) {
      const criticalCount = chunks.filter(
        (c) => c.uniqueness === "CRITICAL",
      ).length;
      const criticalRatio = criticalCount / chunks.length;
      if (criticalRatio < 0.3) {
        warnings.push(
          `Low CRITICAL ratio: ${(criticalRatio * 100).toFixed(1)}% (expected >= 30%)`,
        );
      }
    }

    // Check missing recommended clusters
    const presentClusters = new Set(chunks.map((c) => c.cluster));
    for (const cluster of RECOMMENDED_CLUSTERS) {
      if (!presentClusters.has(cluster)) {
        warnings.push(`Missing recommended cluster: ${cluster}`);
      }
    }

    // Check for orphan chunks (no relations at all)
    const chunkIdsInRelations = new Set<string>();
    for (const rel of relations) {
      chunkIdsInRelations.add(rel.source);
      chunkIdsInRelations.add(rel.target);
    }
    for (const chunk of chunks) {
      if (!chunkIdsInRelations.has(chunk.chunk_id)) {
        warnings.push(`Orphan chunk with no relations: ${chunk.chunk_id}`);
      }
    }

    // Check all same uniqueness level
    if (chunks.length > 1) {
      const uniqueLevels = new Set(chunks.map((c) => c.uniqueness));
      if (uniqueLevels.size === 1) {
        warnings.push(
          `All chunks have the same uniqueness level: ${[...uniqueLevels][0]}`,
        );
      }
    }
  }

  return { valid, errors, warnings };
}
