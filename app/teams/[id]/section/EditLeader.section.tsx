"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/molecules/dialog";
import { Button } from "@/components/atomics/button";
import { EnrichedTeamMember } from "./MemberTable.section";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/molecules/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atomics/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/molecules/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface EditLeaderFormData {
  userId: string;
}

interface EditLeaderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: EnrichedTeamMember[];
  onSave: (userId: string) => void;
  isLoading?: boolean;
  defaultValue?: string;
}

export function EditLeaderDialog({
  isOpen,
  onClose,
  members,
  onSave,
  isLoading = false,
  defaultValue,
}: EditLeaderDialogProps) {
  const form = useForm<EditLeaderFormData>({
    defaultValues: { userId: defaultValue || "" },
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  React.useEffect(() => {
    form.reset({ userId: defaultValue || "" });
  }, [isOpen, defaultValue]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Team Lead</DialogTitle>
          <DialogDescription>
            Select a team member to become the new Team Lead.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              if (data.userId) onSave(data.userId);
            })}
            className="space-y-4 py-2 pb-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Team Lead</FormLabel>
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
                            ? members.find((m) => m.userId === field.value)
                                ?.userData?.displayName ||
                              members.find((m) => m.userId === field.value)
                                ?.userId
                            : "Select team lead"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command>
                        <CommandInput placeholder="Search member..." />
                        <CommandList>
                          <CommandEmpty>No members found.</CommandEmpty>
                          <CommandGroup>
                            {members.map((m) => (
                              <CommandItem
                                value={m.userData?.displayName || m.userId}
                                key={m.userId}
                                onSelect={() => {
                                  form.setValue("userId", m.userId);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    m.userId === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {m.userData?.displayName || m.userId}
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
              <Button
                type="submit"
                disabled={!form.watch("userId") || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
