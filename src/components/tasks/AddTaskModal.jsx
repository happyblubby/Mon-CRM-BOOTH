import React, { useState, useEffect } from "react";
import { TeamMember, Task, Notification, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function AddTaskModal({ isOpen, onOpenChange, onTaskAdded }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    team_member_email: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [members, user] = await Promise.all([
        TeamMember.list(),
        User.me()
      ]);
      // Filter out any members without email
      const validMembers = members.filter(member => member.email && member.email.trim() !== '');
      setTeamMembers(validMembers);
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading data for task modal:", error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const assignedMember = teamMembers.find(m => m.email === newTask.team_member_email);

    if (!newTask.title.trim() || !assignedMember) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        team_member_name: assignedMember.name,
        team_member_email: assignedMember.email,
        status: "pending",
      };

      const createdTask = await Task.create(taskData);

      // Create notification only if assigning to a different user
      if (assignedMember.email !== currentUser?.email && currentUser?.full_name) {
        await Notification.create({
          user_email: assignedMember.email,
          title: "New Task Assigned",
          message: `From ${currentUser.full_name}: "${newTask.title}"`,
          type: "task",
          link: createPageUrl(`TeamMemberDetails?id=${assignedMember.id}`),
          related_entity_id: createdTask.id,
        });
      }

      toast({
        title: "Task Created!",
        description: `"${newTask.title}" has been assigned to ${assignedMember.name}.`,
      });

      onTaskAdded?.();
      onOpenChange(false);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "", team_member_email: "" });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setNewTask(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Assign a new task to a team member.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddTask} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={newTask.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-member">Assign To *</Label>
            <Select
              value={newTask.team_member_email}
              onValueChange={(value) => updateField("team_member_email", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem 
                    key={member.id} 
                    value={member.email}
                  >
                    {member.name} ({member.email})
                  </SelectItem>
                ))}
                {teamMembers.length === 0 && (
                  <SelectItem value="no-members" disabled>
                    No team members available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={newTask.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Task description (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => updateField("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || teamMembers.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}