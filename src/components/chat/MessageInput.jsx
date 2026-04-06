
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadFile } from "@/api/integrations";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";

export default function MessageInput({ onSendMessage, currentUser, activeChannel }) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage({
        message: message.trim(),
        message_type: "text"
      });
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await onSendMessage({
        message: `Shared a file: ${file.name}`,
        message_type: "file",
        file_url
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <div className="flex items-end gap-2 sm:gap-3">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${activeChannel?.display_name || 'channel'}`}
            className="min-h-[44px] max-h-24 sm:max-h-32 resize-none rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 text-sm sm:text-base"
            disabled={isSending}
          />
        </div>
        
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            asChild
            disabled={isUploading}
            className="relative w-10 h-10 sm:w-11 sm:h-11"
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </label>
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          
          <Button
            variant="ghost" 
            size="icon"
            className="w-10 h-10 sm:w-11 sm:h-11 hidden sm:flex"
          >
            <Smile className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="bg-purple-500 hover:bg-purple-600 text-white w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 px-1">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
