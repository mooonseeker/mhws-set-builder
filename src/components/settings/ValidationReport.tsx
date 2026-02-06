/**
 * @fileoverview ValidationReport component for displaying database validation results,
 * including missing items, mismatched fields, and user-defined entries.
 */

import { CheckCircle2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ValidationResult } from "@/utils/data-io";

export interface ValidationReportProps {
  title: string;
  result: ValidationResult;
  onClose: () => void;
}

/**
 * Renders a detailed report of database validation.
 */
export function ValidationReport({
  title,
  result,
  onClose,
}: ValidationReportProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {result.isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <TriangleAlert className="h-5 w-5 text-amber-500" />
          )}
          {title}
        </DialogTitle>
        <DialogDescription>检查本地数据与官方原始数据的差异</DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Stats Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-9 w-1/3 text-center text-xs">
                  缺失条目
                </TableHead>
                <TableHead className="h-9 w-1/3 text-center text-xs">
                  不匹配条目
                </TableHead>
                <TableHead className="h-9 w-1/3 text-center text-xs">
                  用户自定义条目
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="py-2 text-center text-sm font-medium">
                  {result.missingOfficial > 0 ? (
                    <span className="text-destructive font-bold">
                      {result.missingOfficial}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="py-2 text-center text-sm font-medium">
                  {result.mismatched > 0 ? (
                    <span className="text-blue-600">{result.mismatched}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="py-2 text-center text-sm font-medium">
                  {result.userPrivate > 0 ? (
                    <span className="text-orange-600">
                      {result.userPrivate}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {result.errors.length > 0 ? (
          <div className="flex max-h-75 flex-col gap-4 overflow-y-auto pr-1">
            {/* 1. Missing Items */}
            {result.details?.missing && result.details.missing.length > 0 && (
              <div className="space-y-2">
                <p className="text-destructive text-xs font-semibold tracking-wider uppercase">
                  缺失条目列表
                </p>
                <div className="bg-destructive/5 rounded-md border p-2 text-xs">
                  {result.details.missing.map((item) => (
                    <div
                      key={item.id}
                      className="border-destructive/10 flex justify-between border-b py-1 last:border-0"
                    >
                      <span className="text-muted-foreground font-mono">
                        {item.id}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Mismatched Items */}
            {result.details?.mismatched &&
              result.details.mismatched.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
                    不匹配详情
                  </p>
                  <div className="space-y-2">
                    {result.details.mismatched.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border bg-blue-50/50 p-3 text-xs dark:bg-blue-950/20"
                      >
                        <div className="mb-2 flex items-center justify-between border-b border-blue-200/50 pb-2 dark:border-blue-800/50">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                              {item.name}
                            </span>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {item.id}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {item.diffs?.map((diff, idx) => (
                            <div
                              key={idx}
                              className="text-muted-foreground grid grid-cols-[1fr,auto,2fr] gap-2"
                            >
                              <span
                                className="truncate font-mono"
                                title={diff.field}
                              >
                                {diff.field}
                              </span>
                              <span className="text-xs">→</span>
                              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                                <span className="truncate line-through opacity-60">
                                  {JSON.stringify(diff.oldVal)}
                                </span>
                                <span className="text-foreground truncate font-medium">
                                  {JSON.stringify(diff.newVal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* 3. User Private Items */}
            {result.details?.userPrivate &&
              result.details.userPrivate.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase">
                    用户自定义条目
                  </p>
                  <div className="rounded-md border bg-orange-50/50 p-2 text-xs dark:bg-orange-950/20">
                    {result.details.userPrivate.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between border-b border-orange-200/50 py-1 last:border-0 dark:border-orange-800/50"
                      >
                        <span className="text-muted-foreground font-mono">
                          {item.id}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="mb-2 h-10 w-10 text-green-500/20" />
            <p className="text-sm">数据库状态良好，与官方数据完全一致。</p>
          </div>
        )}
      </div>

      <DialogFooter className="sm:justify-center">
        <Button onClick={onClose}>确定</Button>
      </DialogFooter>
    </>
  );
}
