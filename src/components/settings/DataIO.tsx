/**
 * @fileoverview Provides the DataIO component for managing database import, export,
 * validation, and reset operations with a modern UI.
 */

import { useRef } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileInput,
  RotateCcw,
  Share,
  ShieldCheck,
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
import { useDataIO } from "@/hooks";
import type { DataId } from "@/types";

import { ValidationReport } from "./ValidationReport";

/**
 * DataIO component for database management.
 * Displays a unified interface for database validation, reset, export, and import.
 */
export function DataIO() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database categories
  const databaseItems: { id: DataId; name: string }[] = [
    { id: "skills", name: "技能" },
    { id: "accessories", name: "装饰品" },
    { id: "armor", name: "防具" },
    { id: "weapons", name: "武器" },
    { id: "charms", name: "护石" },
  ];

  const {
    processing,
    exportMode,
    dialogState,
    setExportMode,
    closeDialog,
    handleAction,
    handleFileImport,
  } = useDataIO({ databaseItems });

  // Executable actions for each category
  const databaseActions = [
    { id: "validate", label: "验证", icon: ShieldCheck },
    { id: "reset", label: "重置", icon: RotateCcw },
    { id: "export", label: "导出", icon: Share },
    { id: "import", label: "导入", icon: FileInput },
  ] as const;

  // Handles internal file selection logic
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileImport(file, () => {
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
    // Reset value so the same file can be selected again
    e.target.value = "";
  };

  /**
   * Safe wrapper for async actions to satisfy ESLint.
   */
  const onActionClick = (
    itemId: DataId,
    actionId: "validate" | "reset" | "export" | "import",
  ) => {
    void (async () => {
      const shouldTriggerImport = await handleAction(itemId, actionId);
      if (shouldTriggerImport) {
        fileInputRef.current?.click();
      }
    })();
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
            onChange={onFileChange}
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
                          onClick={() => onActionClick(item.id, action.id)}
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
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-md">
          {dialogState.type === "validation" && (
            <ValidationReport
              title={dialogState.title}
              result={dialogState.result}
              onClose={closeDialog}
            />
          )}

          {dialogState.type === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>{dialogState.title}</DialogTitle>
                <DialogDescription>{dialogState.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={closeDialog}>
                  取消
                </Button>
                <Button
                  variant={dialogState.confirmVariant ?? "default"}
                  onClick={() => {
                    const result = dialogState.onConfirm();
                    if (result instanceof Promise) {
                      void result;
                    }
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
                <Button onClick={closeDialog}>关闭</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
