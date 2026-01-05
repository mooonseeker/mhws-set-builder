/**
 * @fileoverview Provides a generic utility to generate JSON data from a CSV file.
 * It uses a metadata file to locate the CSV, validates the data using Zod schemas,
 * and handles errors gracefully.
 */

import csv from "csv-parser";
import fs from "fs";
import path from "path";
import type { ZodError, ZodIssue, ZodType } from "zod";

/**
 * A simplified shape for a Zod issue for consistent error reporting.
 */
interface IssueShape {
  path: string;
  code: string;
  message: string;
  expected?: unknown;
  received?: unknown;
  options?: unknown;
}

/**
 * Formats a ZodIssue into a simplified, consistent shape.
 * @param issue The Zod issue to format.
 * @returns A formatted issue object.
 */
function formatIssue(issue: ZodIssue): IssueShape {
  const base: IssueShape = {
    path: issue.path.length ? issue.path.join(".") : "(root)",
    code: issue.code,
    message: issue.message,
  };

  // Zod v4 issues are a discriminated union; pull common details when present.
  const anyIssue = issue as unknown as Record<string, unknown>;
  if ("expected" in anyIssue) base.expected = anyIssue.expected;
  if ("received" in anyIssue) base.received = anyIssue.received;
  if ("options" in anyIssue) base.options = anyIssue.options;

  return base;
}

/**
 * Formats a ZodError into an array of simplified issue shapes.
 * @param error The ZodError to format.
 * @returns An array of formatted issue objects.
 */
function formatZodError(error: ZodError): IssueShape[] {
  return error.issues.map(formatIssue);
}

/**
 * Custom error class for handling errors during CSV-to-JSON processing.
 * It includes contextual information like the script name, file path, and line number.
 */
export class CsvJsonError extends Error {
  public readonly scriptName: string;
  public readonly filePath: string;
  public readonly line?: number;
  public readonly issues?: IssueShape[];

  public constructor(params: {
    scriptName: string;
    filePath: string;
    message: string;
    line?: number;
    issues?: IssueShape[];
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "CsvJsonError";
    this.scriptName = params.scriptName;
    this.filePath = params.filePath;
    this.line = params.line;
    this.issues = params.issues;
    // Node 16+ supports cause, but keep it best-effort.
    (this as unknown as { cause?: unknown }).cause = params.cause;
  }
}

/**
 * Options for the `generateFromCsv` function.
 * @template TItem The type of a single item parsed from a CSV row.
 * @template TMeta The type of the metadata object.
 */
export interface GenerateFromCsvOptions<TItem, TMeta> {
  /** The name of the script calling this function, for error reporting. */
  scriptName: string;
  /** The path to the JSON metadata file. */
  metaFilePath: string;
  /** The Zod schema for validating the metadata file. */
  metaSchema: ZodType<TMeta>;
  /** The Zod schema for validating each row of the CSV file. */
  rowSchema: ZodType<TItem>;
  /**
   * A function that resolves the CSV file path from the parsed metadata.
   * The returned path can be relative; it will be resolved against the metaFile's directory.
   */
  getCsvPathFromMeta: (meta: TMeta) => string;
}

/**
 * Generates an array of strongly-typed items from a CSV file.
 * @template TItem The type of a single item parsed from a CSV row.
 * @template TMeta The type of the metadata object.
 * @param options The configuration options for the generation process.
 * @returns A promise that resolves to an object containing the parsed metadata,
 *   the path to the CSV file, and the array of parsed items.
 */
export async function generateFromCsv<TItem, TMeta>(
  options: GenerateFromCsvOptions<TItem, TMeta>,
): Promise<{ meta: TMeta; csvFilePath: string; items: TItem[] }> {
  const {
    scriptName,
    metaFilePath,
    metaSchema,
    rowSchema,
    getCsvPathFromMeta,
  } = options;

  // 1. Read and parse the metadata file.
  let meta: TMeta;
  try {
    const metaText = fs.readFileSync(metaFilePath, "utf-8");
    const metaUnknown: unknown = JSON.parse(metaText);
    meta = metaSchema.parse(metaUnknown);
  } catch (err) {
    const issues =
      (err as { name?: string }).name === "ZodError"
        ? formatZodError(err as ZodError)
        : undefined;
    throw new CsvJsonError({
      scriptName,
      filePath: metaFilePath,
      message: `[${scriptName}] Failed to read/parse meta: ${metaFilePath}`,
      issues,
      cause: err,
    });
  }

  // 2. Resolve the CSV file path from the metadata.
  const csvPathFromMeta = getCsvPathFromMeta(meta);
  const csvFilePath = path.resolve(path.dirname(metaFilePath), csvPathFromMeta);

  // 3. Stream, parse, and validate CSV rows.
  const items: TItem[] = [];
  await new Promise<void>((resolve, reject) => {
    let rowIndex = 0; // Data rows only (excluding header)

    fs.createReadStream(csvFilePath, { encoding: "utf8" })
      .pipe(csv())
      .on("data", (row: unknown) => {
        rowIndex += 1;
        const line = rowIndex + 1; // Add 1 for the header line

        const parsed = rowSchema.safeParse(row);
        if (!parsed.success) {
          reject(
            new CsvJsonError({
              scriptName,
              filePath: csvFilePath,
              line,
              message: `[${scriptName}] Invalid CSV row at ${path.basename(
                csvFilePath,
              )}:${line}`,
              issues: formatZodError(parsed.error),
              cause: parsed.error,
            }),
          );
          return;
        }

        items.push(parsed.data);
      })
      .on("end", () => resolve())
      .on("error", (err: unknown) => {
        reject(
          new CsvJsonError({
            scriptName,
            filePath: csvFilePath,
            message: `[${scriptName}] Error during CSV processing: ${csvFilePath}`,
            cause: err,
          }),
        );
      });
  });

  return { meta, csvFilePath, items };
}
