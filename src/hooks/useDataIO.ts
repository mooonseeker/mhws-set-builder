/**
 * @fileoverview Custom hook for managing data import, export, and validation logic.
 * Extracted from DataIO component to improve maintainability and separate concerns.
 */

import { useState } from "react";

import { DataStorage } from "@/services/storage";
import { exportData, importData } from "@/services/storage/transfer";
import type { DataId } from "@/types";
import type { ValidationResult } from "@/utils/data-io";

/**
 * State for managing different types of dialogs.
 */
export type DialogState =
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

export interface UseDataIOProps {
  databaseItems: { id: DataId; name: string }[];
}

/**
 * Hook to manage data I/O operations and UI state.
 */
export function useDataIO({ databaseItems }: UseDataIOProps) {
  const [processing, setProcessing] = useState<{
    id: string;
    action: string;
  } | null>(null);
  const [importTarget, setImportTarget] = useState<DataId | null>(null);
  const [exportMode, setExportMode] = useState<"full" | "diff">("full");
  const [dialogState, setDialogState] = useState<DialogState>({ type: "none" });

  /**
   * Closes any active dialog.
   */
  const closeDialog = () => setDialogState({ type: "none" });

  /**
   * Unified action handler for database operations.
   * @returns true if a file input should be triggered.
   */
  const handleAction = async (
    itemId: DataId,
    actionId: "validate" | "reset" | "export" | "import",
  ): Promise<boolean> => {
    const itemName = databaseItems.find((i) => i.id === itemId)?.name ?? itemId;

    switch (actionId) {
      case "validate": {
        const result = await DataStorage.getValidationResult(itemId);
        setDialogState({
          type: "validation",
          title: `"${itemName}" 数据库验证结果`,
          result,
        });
        return false;
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
        return false;
      }
      case "export": {
        setDialogState({
          type: "confirm",
          title: `导出 "${itemName}" 数据`,
          description: `确定要以 ${exportMode === "diff" ? "差异 (DIFF)" : "全量 (FULL)"} 模式导出数据吗？`,
          confirmText: "确认导出",
          onConfirm: () => {
            exportData(itemId, exportMode);
            setDialogState({ type: "none" });
          },
        });
        return false;
      }
      case "import": {
        setImportTarget(itemId);
        return true;
      }
      default:
        return false;
    }
  };

  /**
   * Handles file selection for import.
   */
  const handleFileImport = (
    file: File | undefined,
    onComplete?: () => void,
  ) => {
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
          onComplete?.();
        }
      },
    });
  };

  return {
    processing,
    exportMode,
    dialogState,
    importTarget,
    setExportMode,
    setDialogState,
    closeDialog,
    handleAction,
    handleFileImport,
  };
}
