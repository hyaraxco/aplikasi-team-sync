"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/molecules/Dialog.molecule";
import { Button } from "@/components/atomics/Button.atomic";
import type { EnrichedTeamMember } from "./MemberTable.section";
import { Spinner } from "@/components/ui/spinner";

interface DeleteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: EnrichedTeamMember | null;
  onDelete: () => void;
  isLoading?: boolean;
}

export function DeleteMemberDialog({
  isOpen,
  onClose,
  member,
  onDelete,
  isLoading,
}: DeleteMemberDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="gap-2">
          <DialogTitle>Remove Member from Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <b>{member?.userData?.displayName}</b> from the team?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 w-4 h-4" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
