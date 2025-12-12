import csv from "csv-parser";
import fs from "fs";
import path from "path";
import type { ZodError, ZodIssue, ZodType } from "zod";

interface IssueShape {
  path: string;
  code: string;
  message: string;
  expected?: unknown;
  received?: unknown;
  options?: unknown;
}

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

function formatZodError(error: ZodError): IssueShape[] {
  return error.issues.map(formatIssue);
}

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

export interface GenerateFromCsvOptions<TItem, TMeta> {
  scriptName: string;
  metaFilePath: string;
  metaSchema: ZodType<TMeta>;
  rowSchema: ZodType<TItem>;
  /**
   * Resolve CSV path from parsed meta.
   *
   * The returned path can be relative; it will be resolved against metaFile's directory.
   */
  getCsvPathFromMeta: (meta: TMeta) => string;
}

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

  // 1) meta
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

  // 2) csv path
  const csvPathFromMeta = getCsvPathFromMeta(meta);
  const csvFilePath = path.resolve(path.dirname(metaFilePath), csvPathFromMeta);

  // 3) stream csv rows -> parse -> collect
  const items: TItem[] = [];
  await new Promise<void>((resolve, reject) => {
    let rowIndex = 0; // data rows only (excluding header)

    fs.createReadStream(csvFilePath, { encoding: "utf8" })
      .pipe(csv())
      .on("data", (row: unknown) => {
        rowIndex += 1;
        const line = rowIndex + 1; // + header line

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
