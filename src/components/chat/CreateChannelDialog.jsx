import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Hash, Lock, Users } from "lucide-react";

export default function CreateChannelDialog({ 
  open, 
  onOpenChange, 
  onCreateChannel, 
  teamMembers 
}) {
  const [channelData, setChannelData] = useState({
    name: "",
    display_name: "",
    description: "",
    channel_type: "public",
    members: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate name from display_name if not provided
    const finalChannelData = {
      ...channelData,
      name: channelData.name || channelData.display_name.toLowerCase().replace(/\s+/g, '-')
    };
    
    onCreateChannel(finalChannelData);
    
    // Reset form
    setChannelData({
      name: "",
      display_name: "",
      description: "",
      channel_type: "public",
      members: []
    });
  };

  const handleMemberToggle = (memberEmail, checked) => {
    if (checked) {
      setChannelData(prev => ({
        ...prev,
        members: [...prev.members, memberEmail]
      }));
    } else {
      setChannelData(prev => ({
        ...prev,
        members: prev.members.filter(email => email !== memberEmail)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display_name">Channel Name *</Label>
            <Input
              id="display_name"
              value={channelData.display_name}
              onChange={(e) => setChannelData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="e.g. Marketing Team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={channelData.description}
              onChange={(e) => setChannelData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this channel about?"
              className="h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Channel Type</Label>
            <Select 
              value={channelData.channel_type} 
              onValueChange={(value) => setChannelData(prev => ({ ...prev, channel_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Public - Anyone can join
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Private - Invite only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {channelData.channel_type === "private" && (
            <div className="space-y-2">
              <Label>Invite Members</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={channelData.members.includes(member.email)}
                      onCheckedChange={(checked) => handleMemberToggle(member.email, checked)}
                    />
                    <Label htmlFor={member.id} className="text-sm flex-1">
                      {member.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-500 hover:bg-purple-600">
              Create Channel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}