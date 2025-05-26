import React from "react";
import { Button } from "@/components/atomics/button";
import { Users2 } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Users2 className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-1">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};
