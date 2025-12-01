import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useSetBuilder } from '@/contexts/SetBuilderContext';

export function SearchConfirmationDialog() {
    const { isSearchConfirmOpen, confirmSearch, cancelSearch, isSearching } = useSetBuilder();

    return (
        <Dialog open={isSearchConfirmOpen} onOpenChange={(open) => !open && cancelSearch()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>开始搜索？</DialogTitle>
                    <DialogDescription>
                        是否基于锁定的装备开始搜索？注意：现有装饰品选择及未锁定的装备选择将被清空。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={cancelSearch} disabled={isSearching}>
                        取消
                    </Button>
                    <Button onClick={confirmSearch} disabled={isSearching}>
                        确认
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}