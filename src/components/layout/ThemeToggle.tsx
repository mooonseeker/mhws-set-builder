/**
 * MHWS护石管理器 - 主题切换按钮组件
 *
 * 提供美观的主题切换功能，支持亮色、暗色和跟随系统三种模式
 */

import { Monitor, Moon, Sun } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTheme } from '@/contexts';

/**
 * 主题切换按钮组件
 *
 * 提供分段式选择的主题切换功能，包含：
 * - 三个选项按钮：亮色、暗色、跟随系统
 * - 当前选中状态高亮显示
 * - 图标直观表示每个主题
 * - 无障碍支持
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(newTheme) => {
                // 防止取消选择时传入空值
                if (newTheme) setTheme(newTheme as 'light' | 'dark' | 'system');
            }}
            className="border rounded-md p-1"
        >
            <ToggleGroupItem value="light" tooltip="亮色模式">
                <Sun className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" tooltip="暗色模式">
                <Moon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="system" tooltip="跟随系统">
                <Monitor className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    );
}