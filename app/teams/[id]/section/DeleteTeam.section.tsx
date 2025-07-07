"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/molecules/dialog";
import { Button } from "@/components/atomics/button";

interface DeleteTeamDialogProps {
  projectId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  teamName?: string;
}

export function DeleteTeamDialog({
  projectId,
  teamId,
  isOpen,
  onClose,
  onDelete,
  isLoading,
  teamName,
}: DeleteTeamDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="mb-2">
            Apakah Anda yakin ingin menghapus team{" "}
            <span className="font-semibold">{teamName}</span>?
          </p>
          <p className="text-sm text-red-500">
            Tindakan ini tidak dapat dibatalkan. Semua data terkait team ini
            akan dihapus secara permanen.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
