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
  Project,
  getProjects,
  getTeamProjects,
  addExistingProjectToTeam,
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const addProjectSchema = z.object({
  projectId: z.string().min(1, "Pilih project yang ingin ditambahkan."),
});

type AddProjectFormData = z.infer<typeof addProjectSchema>;

interface AddExistingProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onProjectAdded: () => void;
}

export function AddExistingProjectDialog({
  isOpen,
  onClose,
  teamId,
  teamName,
  onProjectAdded,
}: AddExistingProjectDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<AddProjectFormData>({
    resolver: zodResolver(addProjectSchema),
    defaultValues: {
      projectId: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
          const [allProjects, teamProjects] = await Promise.all([
            getProjects(),
            getTeamProjects(teamId),
          ]);
          // Filter project yang belum ada di tim
          const teamProjectIds = new Set(teamProjects.map((p) => p.id));
          setProjects(allProjects.filter((p) => !teamProjectIds.has(p.id)));
        } catch (error) {
          console.error("Gagal mengambil daftar project:", error);
          toast.error("Gagal memuat daftar project.");
        }
        setIsLoadingProjects(false);
      };
      fetchProjects();
      form.reset();
    }
  }, [isOpen, form, teamId]);

  const onSubmit = async (data: AddProjectFormData) => {
    setIsSubmitting(true);
    try {
      const addedProject = await addExistingProjectToTeam(
        teamId,
        data.projectId
      );
      toast.success(
        `Berhasil menambahkan project '${addedProject.name}' ke tim ${teamName}.`
      );
      onProjectAdded();
      onClose();
    } catch (error: any) {
      console.error("Gagal menambahkan project:", error);
      toast.error(error.message || "Terjadi kesalahan tak terduga.");
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Project to Team</DialogTitle>
          <DialogDescription>
            Select an existing project to assign to {teamName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2 pb-4"
          >
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project</FormLabel>
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
                            ? projects.find((p) => p.id === field.value)?.name
                            : "Select a project"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command>
                        <CommandInput placeholder="Search project..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingProjects
                              ? "Loading projects..."
                              : "No projects available."}
                          </CommandEmpty>
                          <CommandGroup>
                            {projects.map((project) => (
                              <CommandItem
                                value={project.name}
                                key={project.id}
                                onSelect={() => {
                                  form.setValue("projectId", project.id);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    project.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {project.name}
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
                disabled={isSubmitting || isLoadingProjects}
              >
                {isSubmitting ? "Adding..." : "Add Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
