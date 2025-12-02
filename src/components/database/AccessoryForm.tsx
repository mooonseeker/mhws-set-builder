import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

import type { Accessory, SlotLevel } from '@/types';

interface AccessoryFormProps {
    accessory?: Accessory;
    open: boolean;
    onClose: () => void;
    onSubmit: (accessory: Omit<Accessory, 'id'>) => void;
    error: string | null;
    accessories: Accessory[];
}

/**
 * 装饰品表单组件
 * 用于添加或编辑装饰品
 */
export function AccessoryForm({ accessory, open, onClose, onSubmit, error, accessories }: AccessoryFormProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'weapon' | 'armor'>('weapon');
    const [description, setDescription] = useState('');
    const [rarity, setRarity] = useState(1);
    const [slotLevel, setSlotLevel] = useState<SlotLevel>(1);
    const [color, setColor] = useState('WHITE');
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (accessory) {
            setName(accessory.name);
            setType(accessory.type);
            setDescription(accessory.description);
            setRarity(accessory.rarity);
            setSlotLevel(accessory.slotLevel);
            setColor(accessory.color);
        } else {
            setName('');
            setType('weapon');
            setDescription('');
            setRarity(1);
            setSlotLevel(1);
            setColor('WHITE');
        }
        setLocalError(null);
    }, [accessory, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();

        // 检查名称是否重复（忽略大小写和前后空格）
        const isDuplicate = accessories.some(a => {
            // 编辑模式下，排除当前编辑的装饰品
            if (accessory) {
                return a.id !== accessory.id && a.name.trim().toLowerCase() === trimmedName.toLowerCase();
            }
            return a.name.trim().toLowerCase() === trimmedName.toLowerCase();
        });

        if (isDuplicate) {
            setLocalError(`装饰品 "${trimmedName}" 已存在。`);
            return;
        }
        setLocalError(null);

        onSubmit({
            name: trimmedName,
            type,
            description: description.trim(),
            sortID: 9999, // 用户自定义装饰品默认排在最后
            skills: [], // 暂时为空，用户自定义装饰品无技能
            rarity,
            slotLevel,
            color,
        });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{accessory ? '编辑装饰品' : '添加装饰品'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="name">装饰品名称</Label>
                        <div className="relative">
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setLocalError(null); // 输入时清除错误
                                }}
                                placeholder="输入装饰品名称"
                                required
                                className={(localError || error) ? "pr-20" : ""}
                            />
                            {(localError || error) && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-destructive">
                                    {localError || error}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="type">装饰品类型</Label>
                        <Select value={type} onValueChange={(v) => setType(v as 'weapon' | 'armor')}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weapon">武器</SelectItem>
                                <SelectItem value="armor">防具</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="description">描述</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="输入装饰品描述"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="rarity">稀有度</Label>
                            <Input
                                id="rarity"
                                type="number"
                                min={1}
                                max={12}
                                value={rarity}
                                onChange={(e) => setRarity(parseInt(e.target.value))}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="slotLevel">孔位等级</Label>
                            <Input
                                id="slotLevel"
                                type="number"
                                min={1}
                                max={3}
                                value={slotLevel}
                                onChange={(e) => setSlotLevel(parseInt(e.target.value) as SlotLevel)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="color">颜色</Label>
                        <Select value={color} onValueChange={setColor}>
                            <SelectTrigger id="color">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WHITE">白色</SelectItem>
                                <SelectItem value="BLUE">蓝色</SelectItem>
                                <SelectItem value="RED">红色</SelectItem>
                                <SelectItem value="YELLOW">黄色</SelectItem>
                                <SelectItem value="PURPLE">紫色</SelectItem>
                                <SelectItem value="PINK">粉色</SelectItem>
                                <SelectItem value="ROSE">玫瑰色</SelectItem>
                                <SelectItem value="DPURPLE">深紫色</SelectItem>
                                <SelectItem value="EMERALD">翠绿色</SelectItem>
                                <SelectItem value="ULTRAMARINE">群青色</SelectItem>
                                <SelectItem value="LEMON">柠檬色</SelectItem>
                                <SelectItem value="SKY">天蓝色</SelectItem>
                                <SelectItem value="VERMILION">朱红色</SelectItem>
                                <SelectItem value="GRAY">灰色</SelectItem>
                                <SelectItem value="BROWN">棕色</SelectItem>
                                <SelectItem value="IVORY">象牙色</SelectItem>
                                <SelectItem value="SGREEN">浅绿色</SelectItem>
                                <SelectItem value="MOS">苔绿色</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            取消
                        </Button>
                        <Button type="submit">
                            {accessory ? '保存' : '添加'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}