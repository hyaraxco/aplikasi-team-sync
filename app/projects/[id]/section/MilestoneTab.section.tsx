"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/molecules/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface Milestone {
  id: string;
  title: string;
  status: string;
  dueDate: Date;
}

interface MilestoneTabProps {
  milestones: Milestone[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MilestoneTab({
  milestones,
  onEdit,
  onDelete,
}: MilestoneTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((ms) => (
              <tr key={ms.id}>
                <td>{ms.title}</td>
                <td>
                  <Badge>{ms.status}</Badge>
                </td>
                <td>{format(ms.dueDate, "MMM d, yyyy")}</td>
                <td>
                  {onEdit && (
                    <button onClick={() => onEdit(ms.id)}>Edit</button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(ms.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
