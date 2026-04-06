
import React, { useState } from "react";
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
import { ArrowLeft, Save, Users, Upload, Camera, Key } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AddTeamMember() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // Login-related states are removed from this component
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newMember = await TeamMember.create(memberData);
      toast.success(`${memberData.name} has been added to the team.`);
      // Navigate directly to the new member's detail page
      // The "Create Login" button will be available there.
      navigate(createPageUrl(`TeamMemberDetails?id=${newMember.id}`));
    } catch (error) {
      console.error("Error creating team member:", error);
      toast.error("Failed to create team member. Please try again.");
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

  // Login-related functions are removed from this component
  // const handleCreateLogin = async (teamMemberId = createdTeamMember?.id) => { ... };
  // const handleCredentialsDialogClose = () => { ... };

  const updateField = (field, value) => {
    setMemberData(prev => ({ ...prev, [field]: value }));
  };

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
            onClick={() => navigate(createPageUrl("TeamMembers"))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Add Team Member
            </h1>
            <p className="text-gray-600 text-lg mt-2">Create a new team member profile</p>
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
                        value={memberData.hire_date}
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
                        <span className="text-blue-600 text-xs ml-2">(Required for login account)</span>
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
                  
                  {memberData.email && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Login Account Creation</h4>
                          <p className="text-blue-700 text-sm mt-1">
                            After creating this team member, you'll be able to generate login credentials 
                            that you can share with them directly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onClick={() => navigate(createPageUrl("TeamMembers"))}
                    className="px-8 py-3 rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} // isCreatingLogin removed from here
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                  >
                    {isSubmitting ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Add Team Member
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Removed credential dialog logic and "Create Login Account" button from this page */}
        {/*
        {createdTeamMember && !showCredentialsDialog && memberData.email && !createdTeamMember.has_login_account && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => handleCreateLogin(createdTeamMember.id)}
              disabled={isCreatingLogin}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-500/25"
            >
              {isCreatingLogin ? (
                <>Creating Login...</>
              ) : (
                <>
                  <Key className="w-5 h-5 mr-2" />
                  Create Login Account
                </>
              )}
            </Button>
          </motion.div>
        )}
        */}

        {/* Login Credentials Dialog is no longer rendered here */}
        {/*
        <LoginCredentialsDialog
          isOpen={showCredentialsDialog}
          onClose={handleCredentialsDialogClose}
          credentials={generatedCredentials}
          teamMemberName={memberData.name}
        />
        */}
      </div>
    </div>
  );
}
