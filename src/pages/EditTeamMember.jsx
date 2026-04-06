
import React, { useState, useEffect } from "react";
import { TeamMember } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Users, Upload, Camera, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EditTeamMember() {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [memberData, setMemberData] = useState({
    name: "",
    role: "user", // Default to user role
    photo_url: "",
    email: "",
    phone: "",
    status: "active",
    hire_date: "",
    notes: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setMemberId(id);
      loadMemberData(id);
    } else {
      navigate(createPageUrl("TeamMembers"));
    }
  }, []);

  const loadMemberData = async (id) => {
    setIsLoadingData(true);
    try {
      const data = await TeamMember.get(id);
      // Ensure date is in 'yyyy-MM-dd' format for the input
      if (data.hire_date) {
        data.hire_date = data.hire_date.split('T')[0];
      }
      setMemberData(data);
    } catch (error) {
      console.error("Error loading team member:", error);
      toast.error("Failed to load team member data.");
      navigate(createPageUrl("TeamMembers"));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await TeamMember.update(memberId, memberData);
      toast.success(`${memberData.name}'s profile has been updated.`);
      navigate(createPageUrl(`TeamMemberDetails?id=${memberId}`));
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error("Failed to update team member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPhoto(true);
    try {
      const { file_url } = await UploadFile({ file });
      updateField("photo_url", file_url);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const updateField = (field, value) => {
    setMemberData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl(`TeamMemberDetails?id=${memberId}`))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Edit Team Member
            </h1>
            <p className="text-gray-600 text-lg mt-2">Update {memberData.name}'s profile</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-600" />
                Team Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Photo Upload */}
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-32 h-32 relative">
                    {memberData.photo_url ? (
                      <img
                        src={memberData.photo_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-100 shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-purple-100 shadow-lg">
                        <Camera className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50 w-10 h-10 p-0"
                      asChild
                    >
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        {isUploadingPhoto ? (
                          <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </label>
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Upload a profile photo</p>
                </div>

                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={memberData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                        System Role *
                      </Label>
                      <Select value={memberData.role} onValueChange={(value) => updateField("role", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400">
                          <SelectValue placeholder="Select system role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User (Technician)</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        User: Can view events and manage assigned tasks. Admin: Full access to all features.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hire_date" className="text-sm font-medium text-gray-700">
                        Hire Date
                      </Label>
                      <Input
                        id="hire_date"
                        type="date"
                        value={memberData.hire_date || ""}
                        onChange={(e) => updateField("hire_date", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={memberData.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={memberData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="user@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={memberData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={memberData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 min-h-24"
                    placeholder="Additional notes about this team member..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl(`TeamMemberDetails?id=${memberId}`))}
                    className="px-8 py-3 rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
