/**
 * @fileoverview Provides the DataIO component for managing database import, export,
 * validation, and reset operations with a modern UI.
 */

import { useRef, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileInput,
  RotateCcw,
  Share,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Toggle } from "@/components/ui/toggle";
import { DataStorage } from "@/services/storage";
import { exportData, importData } from "@/services/storage/transfer";
import type { DataId } from "@/types";
import type { ValidationResult } from "@/utils/data-io";

/**
 * State for managing different types of dialogs.
 */
type DialogState =
  | { type: "none" }
  | {
      type: "validation";
      title: string;
      result: ValidationResult;
    }
  | {
      type: "confirm";
      title: string;
      description: string;
      confirmText: string;
      confirmVariant?: "default" | "destructive";
      onConfirm: () => void | Promise<void>;
    }
  | {
      type: "feedback";
      title: string;
      description: string;
      variant: "success" | "error";
    };

/**
 * DataIO component for database management.
 * Displays a unified interface for database validation, reset, export, and import.
 */
export function DataIO() {
  const [processing, setProcessing] = useState<{
    id: string;
    action: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<DataId | null>(null);
  const [exportMode, setExportMode] = useState<"full" | "diff">("full");
  const [dialogState, setDialogState] = useState<DialogState>({ type: "none" });

  // Database categories
  const databaseItems: { id: DataId; name: string }[] = [
    { id: "skills", name: "技能" },
    { id: "accessories", name: "装饰品" },
    { id: "armor", name: "防具" },
    { id: "weapons", name: "武器" },
    { id: "charms", name: "护石" },
  ];

  // Executable actions for each category
  const databaseActions = [
    { id: "validate", label: "验证", icon: ShieldCheck },
    { id: "reset", label: "重置", icon: RotateCcw },
    { id: "export", label: "导出", icon: Share },
    { id: "import", label: "导入", icon: FileInput },
  ] as const;

  // Unified action handler
  const handleAction = async (
    itemId: DataId,
    actionId: (typeof databaseActions)[number]["id"],
  ) => {
    const itemName = databaseItems.find((i) => i.id === itemId)?.name ?? itemId;

    switch (actionId) {
      case "validate": {
        const result = await DataStorage.getValidationResult(itemId);
        setDialogState({
          type: "validation",
          title: `"${itemName}" 数据库验证结果`,
          result,
        });
        break;
      }
      case "reset": {
        setDialogState({
          type: "confirm",
          title: `重置 "${itemName}" 数据`,
          description: "此操作将恢复到初始状态，且不可撤销！确定要继续吗？",
          confirmText: "确认重置",
          confirmVariant: "destructive",
          onConfirm: async () => {
            setProcessing({ id: itemId, action: "reset" });
            try {
              await DataStorage.resetData(itemId);
              setDialogState({
                type: "feedback",
                title: "重置成功",
                description: `"${itemName}" 数据已重置。页面即将刷新以应用更改。`,
                variant: "success",
              });
              setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
              setDialogState({
                type: "feedback",
                title: "重置失败",
                description:
                  error instanceof Error ? error.message : String(error),
                variant: "error",
              });
            } finally {
              setProcessing(null);
            }
          },
        });
        break;
      }
      case "export": {
        exportData(itemId, exportMode);
        break;
      }
      case "import": {
        setImportTarget(itemId);
        fileInputRef.current?.click();
        break;
      }
    }
  };

  // Handles file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = importTarget;
    if (!file || !targetId) return;

    const itemName =
      databaseItems.find((i) => i.id === targetId)?.name ?? targetId;

    setDialogState({
      type: "confirm",
      title: `导入 "${itemName}" 数据`,
      description: `确定要从文件 "${file.name}" 导入数据吗？现有修改可能会被覆盖。`,
      confirmText: "确认导入",
      onConfirm: async () => {
        setProcessing({ id: targetId, action: "import" });
        try {
          await importData(file);
          setDialogState({
            type: "feedback",
            title: "导入成功",
            description: `"${itemName}" 数据已成功导入。页面即将刷新以应用更改。`,
            variant: "success",
          });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          setDialogState({
            type: "feedback",
            title: "导入失败",
            description: error instanceof Error ? error.message : String(error),
            variant: "error",
          });
        } finally {
          setProcessing(null);
          setImportTarget(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
    });

    // Clear input even if cancelled via dialog later
    e.target.value = "";
  };

  return (
    <>
      <Card className="md:col-span-5">
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
          <CardDescription>
            统一管理所有数据库的验证、重置、导出和导入功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileImport}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5 text-center">数据库</TableHead>
                <TableHead className="w-1/5 text-center">验证</TableHead>
                <TableHead className="w-1/5 text-center">重置</TableHead>
                <TableHead className="w-1/5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span>导出</span>
                    <Toggle
                      variant="outline"
                      size="sm"
                      className="h-6 px-1.5 text-xs"
                      pressed={exportMode === "diff"}
                      onPressedChange={(pressed) =>
                        setExportMode(pressed ? "diff" : "full")
                      }
                      aria-label="Toggle export mode"
                    >
                      {exportMode === "diff" ? "DIFF" : "FULL"}
                    </Toggle>
                  </div>
                </TableHead>
                <TableHead className="w-1/5 text-center">导入</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databaseItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center font-medium">
                    {item.name}
                  </TableCell>
                  {databaseActions.map((action) => {
                    const isLoading =
                      processing?.id === item.id &&
                      processing?.action === action.id;
                    return (
                      <TableCell key={action.id} className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mx-auto flex h-auto items-center gap-2 px-3 py-2"
                          disabled={!!processing}
                          onClick={() => void handleAction(item.id, action.id)}
                        >
                          <action.icon
                            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                          />
                          <span className="text-xs">
                            {isLoading ? "处理中..." : action.label}
                          </span>
                        </Button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={dialogState.type !== "none"}
        onOpenChange={(open) => !open && setDialogState({ type: "none" })}
      >
        <DialogContent className="max-w-md">
          {dialogState.type === "validation" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {dialogState.result.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <TriangleAlert className="h-5 w-5 text-amber-500" />
                  )}
                  {dialogState.title}
                </DialogTitle>
                <DialogDescription>
                  检查本地数据与官方原始数据的差异
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Stats Table - Aligned with MigrationReportDialog style */}
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
                          {dialogState.result.missingOfficial > 0 ? (
                            <span className="text-destructive font-bold">
                              {dialogState.result.missingOfficial}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center text-sm font-medium">
                          {dialogState.result.mismatched > 0 ? (
                            <span className="text-blue-600">
                              {dialogState.result.mismatched}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center text-sm font-medium">
                          {dialogState.result.userPrivate > 0 ? (
                            <span className="text-orange-600">
                              {dialogState.result.userPrivate}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {dialogState.result.errors.length > 0 ? (
                  <div className="flex max-h-75 flex-col gap-4 overflow-y-auto pr-1">
                    {/* 1. Missing Items */}
                    {dialogState.result.details?.missing &&
                      dialogState.result.details.missing.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-destructive text-xs font-semibold tracking-wider uppercase">
                            缺失条目列表
                          </p>
                          <div className="bg-destructive/5 rounded-md border p-2 text-xs">
                            {dialogState.result.details.missing.map((item) => (
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
                    {dialogState.result.details?.mismatched &&
                      dialogState.result.details.mismatched.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
                            不匹配详情
                          </p>
                          <div className="space-y-2">
                            {dialogState.result.details.mismatched.map(
                              (item) => (
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
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* 3. User Private Items */}
                    {dialogState.result.details?.userPrivate &&
                      dialogState.result.details.userPrivate.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase">
                            用户自定义条目
                          </p>
                          <div className="rounded-md border bg-orange-50/50 p-2 text-xs dark:bg-orange-950/20">
                            {dialogState.result.details.userPrivate.map(
                              (item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between border-b border-orange-200/50 py-1 last:border-0 dark:border-orange-800/50"
                                >
                                  <span className="text-muted-foreground font-mono">
                                    {item.id}
                                  </span>
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="mb-2 h-10 w-10 text-green-500/20" />
                    <p className="text-sm">
                      数据库状态良好，与官方数据完全一致。
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="sm:justify-center">
                <Button onClick={() => setDialogState({ type: "none" })}>
                  确定
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogState.type === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>{dialogState.title}</DialogTitle>
                <DialogDescription>{dialogState.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDialogState({ type: "none" })}
                >
                  取消
                </Button>
                <Button
                  variant={dialogState.confirmVariant ?? "default"}
                  onClick={() => {
                    void dialogState.onConfirm();
                  }}
                >
                  {dialogState.confirmText}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogState.type === "feedback" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {dialogState.variant === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="text-destructive h-5 w-5" />
                  )}
                  {dialogState.title}
                </DialogTitle>
                <DialogDescription>{dialogState.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDialogState({ type: "none" })}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
