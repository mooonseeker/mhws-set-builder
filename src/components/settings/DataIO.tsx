import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataStorage } from "@/services/DataStorage";
import { exportData, importData, validateData } from "@/utils/data-io";

import type { DataId } from "@/types";
/**
 * 数据库 IO 管理表格组件
 * 显示数据库验证、重置、导出和导入功能的统一界面
 */
export function DataIO() {
  const [processing, setProcessing] = useState<{
    id: string;
    action: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<DataId | null>(null);

  // 定义数据库类别
  const databaseItems: { id: DataId; name: string }[] = [
    { id: "skills", name: "技能" },
    { id: "accessories", name: "装饰品" },
    { id: "armor", name: "防具" },
    { id: "weapons", name: "武器" },
    { id: "charms", name: "护石" },
  ];

  // 定义每个类别可执行的操作
  const databaseActions = [
    { id: "validate", label: "验证", icon: ShieldCheck },
    { id: "reset", label: "重置", icon: RotateCcw },
    { id: "export", label: "导出", icon: Download },
    { id: "import", label: "导入", icon: Upload },
  ] as const;

  // 统一操作处理
  const handleAction = async (
    itemId: DataId,
    actionId: (typeof databaseActions)[number]["id"],
  ) => {
    setProcessing({ id: itemId, action: actionId });
    try {
      switch (actionId) {
        case "validate": {
          const currentItems = DataStorage.loadData(itemId);
          const initialData = await import(`../../data/initial-${itemId}.json`);
          const initialItems = (initialData.default[itemId] ||
            []) as typeof currentItems;
          const result = validateData(currentItems, initialItems);
          if (result.isValid) {
            alert(
              `"${databaseItems.find((i) => i.id === itemId)?.name}"数据库验证通过！数据完整且一致。`,
            );
          } else {
            alert(
              `"${databaseItems.find((i) => i.id === itemId)?.name}"数据库验证失败：\n\n${result.errors.join("\n")}`,
            );
          }
          break;
        }
        case "reset": {
          if (
            confirm(
              `确定要重置"${databaseItems.find((i) => i.id === itemId)?.name}"数据吗？\n\n此操作将恢复到初始状态，且不可撤销！`,
            )
          ) {
            await DataStorage.resetData(itemId);
            alert(
              `"${databaseItems.find((i) => i.id === itemId)?.name}"数据已重置。`,
            );
            window.location.reload();
          }
          break;
        }
        case "export": {
          exportData(itemId);
          break;
        }
        case "import": {
          setImportTarget(itemId);
          fileInputRef.current?.click();
          break;
        }
      }
    } catch (error) {
      alert(
        `操作失败：${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setProcessing(null);
    }
  };

  // 处理文件导入
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importTarget) return;

    if (
      confirm(
        `确定要导入"${databaseItems.find((i) => i.id === importTarget)?.name}"数据吗？\n\n这将覆盖当前数据！`,
      )
    ) {
      setProcessing({ id: importTarget, action: "import" });
      try {
        await importData(file);
        alert("导入成功！");
        window.location.reload();
      } catch (error) {
        alert(
          `导入失败：${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setProcessing(null);
        setImportTarget(null);
        e.target.value = ""; // 重置文件输入
      }
    } else {
      setImportTarget(null);
      e.target.value = ""; // 重置文件输入
    }
  };

  return (
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
              <TableHead className="w-1/5 text-center">导出</TableHead>
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
                        disabled={
                          !!processing ||
                          (item.id === "charms" && action.id === "validate")
                        }
                        onClick={() => handleAction(item.id, action.id)}
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
  );
}
