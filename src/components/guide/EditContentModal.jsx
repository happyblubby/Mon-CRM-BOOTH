
import React, { useState, useEffect, useCallback } from 'react';
import { GuideContent } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, Image, Type, Plus, File as FileIcon, Trash2, X } from 'lucide-react';

// Memoized BlockEditor to prevent re-renders and focus loss
const BlockEditor = React.memo(({ block, index, updateBlock, removeBlock, handleImageUpload, canRemove }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      await handleImageUpload(file, index);
      setIsUploading(false);
    };

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Select
              value={block.type}
              onValueChange={(value) => updateBlock(index, 'type', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">📝 Text Only</SelectItem>
                <SelectItem value="image_text">🖼️ Image + Text</SelectItem>
                <SelectItem value="step">📋 Step</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="tip">💡 Tip</SelectItem>
              </SelectContent>
            </Select>
            
            {canRemove && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => removeBlock(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {(block.type === 'image_text' || block.type === 'step') && (
            <div className="mb-4">
              <Label className="text-sm font-medium">Image</Label>
              <div className="mt-2 flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  asChild
                  size="sm"
                >
                  <label htmlFor={`image-upload-${index}`} className="cursor-pointer">
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Image
                  </label>
                </Button>
                <input
                  id={`image-upload-${index}`}
                  type="file"
                  accept="image/jpeg, image/png, image/gif, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {block.image_url && <img src={block.image_url} alt="Preview" className="w-20 h-20 object-cover rounded border" />}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">
              {block.type === 'step' ? 'Step Instructions' : 
               block.type === 'warning' ? 'Warning Message' :
               block.type === 'tip' ? 'Tip Content' : 'Content'}
            </Label>
            <Textarea
              value={block.content}
              onChange={(e) => updateBlock(index, 'content', e.target.value)}
              placeholder={
                block.type === 'step' ? 'Describe this step clearly...' :
                block.type === 'warning' ? 'What should they be careful about?' :
                block.type === 'tip' ? 'Share a helpful tip...' :
                'Enter your content here...'
              }
              className="mt-2 min-h-20"
            />
          </div>
        </CardContent>
      </Card>
    );
});

export default function EditContentModal({ isOpen, onClose, contentId, sectionId, onSaved }) {
  const [contentData, setContentData] = useState({
    question: '',
    answer: '',
    content_type: 'step_by_step',
    image_url: '',
    order_index: 0,
    is_published: true,
    content_blocks: [],
    pdf_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadContent();
    } else {
      setContentData({
        question: '', answer: '', content_type: 'step_by_step', image_url: '', pdf_url: '', order_index: 0, is_published: true,
        content_blocks: [{ type: 'text', content: '', image_url: '' }]
      });
    }
  }, [contentId]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const content = await GuideContent.get(contentId);
      let blocks = [];
      try {
        if (content.answer && content.answer.startsWith('[{')) {
          blocks = JSON.parse(content.answer);
        } else {
          blocks = [{ type: 'text', content: content.answer || '', image_url: content.image_url || '' }];
        }
      } catch {
        blocks = [{ type: 'text', content: content.answer || '', image_url: content.image_url || '' }];
      }
      
      setContentData({
        ...content,
        pdf_url: content.pdf_url || '',
        content_blocks: blocks.length > 0 ? blocks : [{ type: 'text', content: '', image_url: '' }]
      });
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback(async (file, blockIndex) => {
    try {
      const { file_url } = await UploadFile({ file });
      updateBlock(blockIndex, 'image_url', file_url);
      updateBlock(blockIndex, 'type', 'image_text');
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    try {
      const { file_url } = await UploadFile({ file });
      updateField('pdf_url', file_url);
    } catch (error) {
      console.error('Error uploading PDF:', error);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const addBlock = useCallback((type = 'text') => {
    const newBlock = { type, content: '', image_url: '' };
    setContentData(prev => ({ ...prev, content_blocks: [...prev.content_blocks, newBlock] }));
  }, []);

  const removeBlock = useCallback((index) => {
    setContentData(prev => ({ ...prev, content_blocks: prev.content_blocks.filter((_, i) => i !== index) }));
  }, []);

  const updateBlock = useCallback((index, field, value) => {
    setContentData(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.map((block, i) => i === index ? { ...block, [field]: value } : block)
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentData.question.trim()) return;
    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...contentData, answer: JSON.stringify(contentData.content_blocks), section_id: sectionId || contentData.section_id };
      if (contentId) {
        await GuideContent.update(contentId, dataToSubmit);
      } else {
        await GuideContent.create(dataToSubmit);
      }
      onSaved();
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setContentData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{contentId ? 'Edit Guide Content' : 'Create New Guide Content'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="question">Guide Title *</Label>
                <Input id="question" value={contentData.question} onChange={(e) => updateField('question', e.target.value)} placeholder="e.g., How to set up the camera" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input id="order" type="number" value={contentData.order_index} onChange={(e) => updateField('order_index', parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="flex items-center space-x-2 pt-7">
                  <input type="checkbox" id="published" checked={contentData.is_published} onChange={(e) => updateField('is_published', e.target.checked)} className="rounded" />
                  <Label htmlFor="published">Published</Label>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-2 mb-6">
                <Label className="text-base font-semibold">PDF Attachment</Label>
                <Card className="p-4 bg-gray-50/50">
                  {contentData.pdf_url ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileIcon className="w-5 h-5 text-red-600" />
                        <a href={contentData.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">View Attached PDF</a>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => updateField('pdf_url', '')}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" disabled={isUploadingPdf} asChild size="sm">
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          {isUploadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload PDF
                        </label>
                      </Button>
                       <input id="pdf-upload" type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" disabled={isUploadingPdf} />
                      <p className="text-sm text-gray-500">Attach a reference PDF to this article.</p>
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-1 mb-4">
                <Label className="text-base font-semibold">Content Blocks</Label>
                <p className="text-sm text-gray-500">Add different types of content to create your guide</p>
              </div>

              {contentData.content_blocks.map((block, index) => (
                <BlockEditor key={index} block={block} index={index} updateBlock={updateBlock} removeBlock={removeBlock} handleImageUpload={handleImageUpload} canRemove={contentData.content_blocks.length > 1} />
              ))}

              <div className="flex gap-2 mb-4">
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('text')}><Type className="w-4 h-4 mr-2" />Add Text</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('image_text')}><Image className="w-4 h-4 mr-2" />Add Image</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('step')}><Plus className="w-4 h-4 mr-2" />Add Step</Button>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {contentId ? 'Update' : 'Create'} Guide
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
