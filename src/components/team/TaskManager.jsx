import React, { useState, useEffect } from "react";
import { Task, Notification, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle2, AlertCircle, Calendar, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const priorityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200"
};

const statusColors = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200"
};

export default function TaskManager({ teamMember }) {
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: ""
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (teamMember?.email) {
      loadTasks();
    }
  }, [teamMember]);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
      setError("Failed to load user information");
    }
  };

  const loadTasks = async () => {
    if (!teamMember?.email) return;
    
    try {
      setError(null);
      // Only load tasks assigned to this specific team member
      const tasksData = await Task.filter(
        { team_member_email: teamMember.email },
        "-created_date"
      );
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError("Failed to load tasks");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !teamMember?.email || !teamMember?.name) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || "",
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        team_member_name: teamMember.name,
        team_member_email: teamMember.email,
        status: "pending"
      };

      console.log("Creating task with data:", taskData);
      const createdTask = await Task.create(taskData);
      console.log("Task created successfully:", createdTask);

      // Create notification for the assigned team member (only if different from current user)
      if (teamMember.email !== currentUser?.email && currentUser?.email) {
        try {
          await Notification.create({
            user_email: teamMember.email,
            title: "New Task Assigned",
            message: `You have been assigned a new task: "${newTask.title}"`,
            type: "task",
            link: createPageUrl(`TeamMemberDetails?id=${teamMember.id}`),
            related_entity_id: createdTask.id
          });
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      // Reset form
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: ""
      });
      setShowAddTask(false);
      
      // Reload tasks
      await loadTasks();
      
    } catch (error) {
      console.error("Error creating task:", error);
      setError(`Failed to create task: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      setError(null);
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const updateData = {
        status: newStatus,
        completed_date: newStatus === "completed" ? new Date().toISOString().split('T')[0] : null
      };

      await Task.update(task.id, updateData);

      // Create notification for task completion (only if different users and current user exists)
      if (newStatus === "completed" && teamMember.email !== currentUser?.email && currentUser?.email) {
        try {
          await Notification.create({
            user_email: currentUser.email, // Notify the person who assigned the task
            title: "Task Completed",
            message: `${teamMember.name} has completed the task: "${task.title}"`,
            type: "task",
            link: createPageUrl(`TeamMemberDetails?id=${teamMember.id}`),
            related_entity_id: task.id
          });
        } catch (notifError) {
          console.error("Error creating completion notification:", notifError);
        }
      }

      await loadTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      setError(`Failed to update task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      setError(null);
      await Task.delete(taskId);
      await loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setError(`Failed to delete task: ${error.message || 'Unknown error'}`);
    }
  };

  const pendingTasks = tasks.filter(task => task.status === "pending");
  const completedTasks = tasks.filter(task => task.status === "completed");

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Tasks for {teamMember?.name || 'Team Member'}
          </CardTitle>
          <Button
            onClick={() => setShowAddTask(true)}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl"
            disabled={!teamMember?.email}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Add Task Form */}
        <AnimatePresence>
          {showAddTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 border border-gray-200 rounded-2xl bg-gray-50"
            >
              <form onSubmit={handleAddTask} className="space-y-4">
                <Input
                  placeholder="Task title*"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="rounded-xl border-gray-200"
                  required
                  disabled={isSubmitting}
                />
                <Textarea
                  placeholder="Task description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="rounded-xl border-gray-200"
                  disabled={isSubmitting}
                />
                <div className="flex gap-4">
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="rounded-xl border-gray-200"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddTask(false);
                      setError(null);
                    }}
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newTask.title.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    {isSubmitting ? "Adding..." : "Add Task"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-orange-50 rounded-2xl text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
            <p className="text-sm text-orange-700">Pending Tasks</p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-center">
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-sm text-green-700">Completed Tasks</p>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
              <p className="text-gray-500">Add the first task for this team member.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border rounded-2xl transition-all duration-200 ${
                  task.status === "completed" ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="mt-1 flex-shrink-0"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-emerald-500 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        task.status === "completed" ? "text-green-700 line-through" : "text-gray-900"
                      }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority} priority
                        </Badge>
                        <Badge className={statusColors[task.status]}>
                          {task.status}
                        </Badge>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}