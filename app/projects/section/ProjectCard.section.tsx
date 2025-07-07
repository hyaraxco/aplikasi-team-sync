"use client";

import React from "react";
import { Card, CardContent } from "@/components/molecules/Card.molecule";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atomics/Avatar.atomic";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/atomics/Progress.atomic";
import { type Project, type Team } from "@/lib/firestore";
import BadgePriority from "@/components/atomics/BadgePriority.atomic";
import BadgeStatus from "@/components/atomics/BadgeStatus.atomic";

interface ProjectCardProps {
  project: Project & {
    assignedTeams?: Team[];
    metrics?: {
      totalTasks: number;
      completedTasks: number;
      completionRate: number;
    };
  };
  onClick?: () => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const deadlineDate = project.deadline ? project.deadline.toDate() : undefined;
  const progress = project.metrics?.completionRate || 0;
  const completedTasks = project.metrics?.completedTasks || 0;
  const totalTasks = project.metrics?.totalTasks || 0;

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-md flex flex-col h-full"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3 flex flex-col flex-grow">
        <div className="flex-grow space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-lg leading-tight truncate">
                {project.name}
              </h3>
              <BadgePriority priority={project.priority} />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">
              {project.description}
            </p>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Clock className="mr-1.5 h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Due: </span>
              <span className="text-xs ml-1 font-medium">
                {deadlineDate ? format(deadlineDate, "MMM d, yyyy") : "N/A"}
              </span>
            </div>
            <BadgeStatus status={project.status} />
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2 w-full"
              aria-label={`${project.name} progress`}
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-muted-foreground">Tasks: </span>
              <span>
                {completedTasks}/{totalTasks}
              </span>
            </div>
            <div className="flex -space-x-2">
              {project.assignedTeams?.slice(0, 3).map((team) => (
                <Avatar
                  key={team.id}
                  className="h-6 w-6 border-2 border-background"
                >
                  <AvatarImage
                    src={team.memberDetails?.[0]?.photoURL || undefined}
                    alt={team.name}
                  />
                  <AvatarFallback className="text-[10px]">
                    {team.name?.charAt(0).toUpperCase() || "T"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.teams && project.teams.length > 3 && (
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                  +{project.teams.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
