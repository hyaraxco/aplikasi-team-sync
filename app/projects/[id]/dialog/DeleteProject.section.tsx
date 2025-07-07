"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/molecules/dialog";
import { Button } from "@/components/atomics/button";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  projectName: string;
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  onDelete,
  isLoading,
  projectName,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="mb-2">
            Are you sure you want to delete project{" "}
            <span className="font-semibold">{projectName}</span>?
          </p>
          <p className="text-sm text-red-500">
            This action cannot be undone. All data related to this project will
            be permanently deleted.
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
