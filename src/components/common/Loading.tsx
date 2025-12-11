import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
}

/**
 * 加载状态组件
 */
export function Loading({ message = "加载中..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <p className="text-muted-foreground mt-4">{message}</p>
    </div>
  );
}
