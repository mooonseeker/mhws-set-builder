/**
 * @fileoverview Component for reviewing database changes before migration or import.
 */

import { useState } from "react";

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataStorage } from "@/services/storage";
import type { DataId } from "@/types";
import type { DataDifference, ValidationResult } from "@/utils";

interface MigrationReviewProps {
  analysis: Map<DataId, ValidationResult>;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  isDialog?: boolean;
}

/**
 * Screen or dialog displayed when high-risk database changes are detected.
 * Allows users to review modifications and deletions before proceeding.
 */
export function MigrationReview({
  analysis,
  onConfirm,
  onCancel,
  title = "数据库迁移预审",
  description = "检测到应用版本更新。您在旧版本中对官方数据进行的修改或删除操作可能会影响新版本数据的准确性，请审阅以下变更。",
  isDialog = false,
}: MigrationReviewProps) {
  const [loading, setLoading] = useState(false);

  const databaseNames: Record<DataId, string> = {
    skills: "技能",
    accessories: "装饰品",
    armor: "防具",
    weapons: "武器",
    charms: "护石",
    settings: "设置",
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        // Default behavior for startup migration
        await DataStorage.confirmMigration();
        window.location.reload();
      }
    } catch (error) {
      console.error("Confirmation failed:", error);
      alert("操作失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "确定要重置所有数据吗？此操作将清除您当前的所有个性化设置和护石，且不可撤销。",
      )
    ) {
      DataStorage.clearAll();
      window.location.reload();
    }
  };

  const containerClass = isDialog
    ? "w-full text-left"
    : "min-h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fixed inset-0 z-50 overflow-y-auto";

  const handleConfirmAction = () => {
    void handleConfirm();
  };

  const handleResetAction = () => {
    handleReset();
  };

  return (
    <div className={containerClass}>
      <Card
        className={`w-full max-w-4xl border-t-4 border-t-amber-500 bg-white shadow-2xl ${isDialog ? "border-none shadow-none" : "animate-in fade-in zoom-in my-auto duration-300"}`}
      >
        <CardHeader className="relative border-b bg-amber-50/50 pb-6">
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-slate-400"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>
          <CardDescription className="text-base text-slate-600">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div
            className={`custom-scrollbar space-y-6 overflow-y-auto pr-2 ${isDialog ? "max-h-[50vh]" : "max-h-[60vh]"}`}
          >
            {Array.from(analysis.entries()).map(([id, result]) => (
              <div key={id} className="space-y-3">
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white py-1">
                  <Database className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-slate-800">
                    {databaseNames[id]}
                  </h3>
                  <Badge variant="outline" className="ml-auto">
                    {result.mismatched + result.missingOfficial} 项变更
                  </Badge>
                </div>

                <div className="space-y-2">
                  {result.details.mismatched.map((item) => (
                    <DiffItem key={item.id} item={item} type="modify" />
                  ))}
                  {result.details.missing.map((item) => (
                    <DiffItem key={item.id} item={item} type="delete" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t bg-slate-50/50 pt-6 sm:flex-row">
          <div className="mb-2 text-sm text-slate-500 sm:mr-auto sm:mb-0">
            点击“确认应用”将把变更合并到数据库中。
          </div>
          {!isDialog && (
            <Button
              variant="ghost"
              onClick={handleResetAction}
              disabled={loading}
            >
              放弃修改并重置
            </Button>
          )}
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              取消
            </Button>
          )}
          <Button
            onClick={handleConfirmAction}
            disabled={loading}
            className="min-w-30 bg-amber-600 text-white hover:bg-amber-700"
          >
            {loading ? "处理中..." : "确认并应用"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Individual diff item with expandable details.
 */
function DiffItem({
  item,
  type,
}: {
  item: DataDifference;
  type: "modify" | "delete";
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (type === "modify") {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border bg-white text-left transition-colors hover:border-slate-300">
      <div
        className="flex cursor-pointer items-center gap-3 p-3"
        onClick={toggleOpen}
      >
        <div
          className={`rounded p-1.5 ${type === "modify" ? "bg-amber-50" : "bg-red-50"}`}
        >
          {type === "modify" ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <Trash2 className="h-4 w-4 text-red-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900">
              {item.name}
            </span>
            <Badge
              variant={type === "modify" ? "secondary" : "destructive"}
              className="h-4 text-[10px]"
            >
              {type === "modify" ? "已修改" : "已删除"}
            </Badge>
          </div>
          <div className="truncate font-mono text-xs text-slate-500">
            {item.id}
          </div>
        </div>

        {type === "modify" && (
          <div className="text-slate-400">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {isOpen && type === "modify" && item.diffs && (
        <div className="border-t bg-slate-50/30 px-3 pt-0 pb-3">
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-4 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              <div>数据库当前值</div>
              <div>导入文件中的值</div>
            </div>
            <div className="space-y-1.5">
              {item.diffs.map((diff, idx) => (
                <div
                  key={idx}
                  className="rounded border bg-white p-2 text-xs shadow-sm"
                >
                  <div className="mb-1 font-mono text-[10px] font-bold text-blue-600">
                    属性: {diff.field}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-r pr-2 break-all text-slate-500">
                      {formatValue(diff.oldVal)}
                    </div>
                    <div className="font-medium break-all text-amber-700">
                      {formatValue(diff.newVal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {type === "delete" && (
        <div className="px-3 pb-2 text-[11px] text-slate-400 italic">
          该条目在当前数据库中存在，但在导入源中已被删除。应用后将再次被隐藏。
        </div>
      )}
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return "(无)";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return JSON.stringify(val);
}
