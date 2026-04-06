import React, { useState, useCallback } from 'react';
import { Event } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PhotoGallery({ eventId, photos = [], onPhotosUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (files) => {
    if (!eventId) {
      console.error("No event ID provided to PhotoGallery");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => UploadFile({ file }));
      const uploadedFiles = await Promise.all(uploadPromises);
      const newImageUrls = uploadedFiles.map(res => res.file_url);
      
      const currentGallery = photos || [];
      const updatedGallery = [...currentGallery, ...newImageUrls];
      
      await Event.update(eventId, { photo_gallery: updatedGallery });
      
      if (onPhotosUpdate) {
        onPhotosUpdate();
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [eventId]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Don't render if no eventId is provided
  if (!eventId) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-full">
        <CardContent className="p-6 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Event ID required to display photos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-full">
      <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold text-gray-900">Photo Gallery</CardTitle>
        <Button size="sm" asChild className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl">
          <label htmlFor="photo-upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </label>
        </Button>
        <input 
          id="photo-upload"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          disabled={isUploading}
        />
      </CardHeader>
      <CardContent 
        className="p-6"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="relative">
          {dragActive && (
            <div className="absolute inset-0 bg-purple-500/10 border-2 border-dashed border-purple-400 rounded-2xl flex items-center justify-center z-10">
              <p className="font-bold text-purple-600 text-lg">Drop photos to upload</p>
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600"/>
                <p className="text-lg font-medium text-purple-600">Uploading...</p>
              </div>
            </div>
          )}

          {(!photos || photos.length === 0) && !isUploading ? (
            <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">No Photos Yet</h3>
              <p className="text-gray-500 mt-2">Drag & drop photos here or use the upload button.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {photos?.map((url, index) => (
                  <Dialog key={url}>
                    <DialogTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                      >
                        <img 
                          src={url} 
                          alt={`Event photo ${index + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 border-0">
                      <img 
                        src={url} 
                        alt={`Event photo ${index + 1}`} 
                        className="w-full h-auto object-contain rounded-lg"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}