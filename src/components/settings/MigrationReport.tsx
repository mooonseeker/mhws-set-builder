/**
 * @fileoverview Component for displaying a migration report after database updates.
 */

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { DataStorage } from "@/services/storage";
import type { DataId } from "@/types";
import type { MigrationStats } from "@/utils";

/**
 * Dialog component that shows statistics about data migration.
 */
export function MigrationReport() {
  // Retrieve report during initialization to avoid setState in useEffect
  const [report] = useState<Map<DataId, MigrationStats> | null>(() =>
    DataStorage.getAndClearMigrationReport(),
  );
  const [open, setOpen] = useState(!!(report && report.size > 0));

  if (!report || report.size === 0) return null;

  const databaseNames: Record<DataId, string> = {
    skills: "技能",
    accessories: "装饰品",
    armor: "防具",
    weapons: "武器",
    charms: "护石",
    settings: "设置",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>数据库更新完成</DialogTitle>
          <DialogDescription>
            检测到新版本数据，已自动为您完成合并迁移。以下是变更详情：
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据库</TableHead>
                <TableHead className="text-right">新增条目</TableHead>
                <TableHead className="text-right">修正条目</TableHead>
                <TableHead className="text-right">保留自定义</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(report.entries()).map(
                ([id, stats]: [DataId, MigrationStats]) => (
                  <TableRow key={id}>
                    <TableCell className="font-medium">
                      {databaseNames[id]}
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.officialAdded > 0 ? (
                        <span className="text-green-600">
                          +{stats.officialAdded}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.officialUpdated > 0 ? (
                        <span className="text-blue-600">
                          {stats.officialUpdated}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.userRetainedIds.length > 0 ? (
                        <span className="font-medium text-orange-600">
                          {stats.userRetainedIds.length}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
