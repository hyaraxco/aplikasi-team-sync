"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/atomics/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/molecules/dialog";
import { Input } from "@/components/atomics/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/molecules/form";
import { toast } from "sonner";
import {
  UserData,
  getUsers,
  addExistingUserToTeam,
  addActivity,
  ActivityActionType,
} from "@/lib/firestore";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/molecules/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atomics/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { serverTimestamp } from "firebase/firestore";

const addMemberSchema = z.object({
  userId: z.string().min(1, "User selection is required."),
  // role: z // Dihapus karena peran akan diambil dari posisi pengguna
  //   .string()
  //   .min(2, "Role must be at least 2 characters.")
  //   .max(50, "Role must be 50 characters or less."),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onMemberAdded: () => void; // To refresh the list after adding
}

export function AddMemberDialog({
  isOpen,
  onClose,
  teamId,
  teamName,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { user } = useAuth();

  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userId: "",
      // role: "", // Dihapus
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const allUsers = await getUsers(); // Assuming getUsers fetches all users
          // TODO: Filter out users already in the current team if possible, or handle in addExistingUserToTeam
          setUsers(allUsers);
        } catch (error) {
          console.error("Failed to fetch users:", error);
          toast.error("Failed to load users for selection.");
        }
        setIsLoadingUsers(false);
      };
      fetchUsers();
      form.reset(); // Reset form when dialog opens
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddMemberFormData) => {
    setIsSubmitting(true);
    try {
      const selectedUser = users.find((u) => u.id === data.userId);
      if (!selectedUser) {
        toast.error("Selected user not found. Please try again.");
        setIsSubmitting(false);
        return;
      }
      if (!selectedUser.position) {
        toast.error(
          `User ${selectedUser.displayName || selectedUser.email} does not have a position defined. Cannot add to team.`
        );
        setIsSubmitting(false);
        return;
      }

      const newMember = await addExistingUserToTeam(
        teamId,
        data.userId,
        selectedUser.position // Menggunakan posisi pengguna sebagai peran
      );
      const userName =
        selectedUser?.displayName || selectedUser?.email || data.userId;
      if (user) {
        await addActivity({
          userId: user.uid,
          type: "team",
          action: ActivityActionType.TEAM_MEMBER_ADDED,
          targetId: teamId,
          targetName: teamName,
          timestamp: serverTimestamp(),
          teamId: teamId,
          details: {
            addedUserId: data.userId,
            addedUserName: userName,
            addedUserPosition: selectedUser.position,
          },
        });
      }
      toast.success(
        `Successfully added ${userName} to ${teamName} as ${selectedUser.position}.` // Menggunakan posisi pengguna
      );
      onMemberAdded(); // Callback to refresh the member list in the parent component
      onClose(); // Close the dialog
    } catch (error: any) {
      console.error("Failed to add member:", error);
      toast.error(error.message || "An unexpected error occurred.");
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add an existing user to the {teamName} team and assign them a role.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2 pb-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>User</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={popoverOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? users.find((user) => user.id === field.value)
                                ?.displayName ||
                              users.find((user) => user.id === field.value)
                                ?.email
                            : "Select user"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command>
                        <CommandInput placeholder="Search user..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingUsers
                              ? "Loading users..."
                              : "No user found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {users.map((user) => (
                              <CommandItem
                                value={
                                  user.displayName || user.email || user.id
                                }
                                key={user.id}
                                onSelect={() => {
                                  form.setValue("userId", user.id);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    user.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {user.displayName || user.email}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isLoadingUsers}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Adding
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
