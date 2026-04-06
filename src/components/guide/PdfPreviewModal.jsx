import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Loader2 } from 'lucide-react';

export default function PdfPreviewModal({ isOpen, onClose, pdfUrl, originalUrl, isLoading }) {
  // Use originalUrl for the "Open in New Tab" link to preserve download functionality if needed
  const externalLink = originalUrl || pdfUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between flex-shrink-0">
          <DialogTitle>PDF Preview</DialogTitle>
          <div className="flex items-center gap-2">
            {externalLink && (
               <a href={externalLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                  </Button>
              </a>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading Preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border-0"
            />
          ) : (
            <p className="text-gray-600">Could not load PDF.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}