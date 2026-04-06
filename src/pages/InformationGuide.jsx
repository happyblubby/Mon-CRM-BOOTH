
import React, { useState, useEffect } from 'react';
import { GuideSection, GuideContent, User } from '@/api/entities';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HardDrive,
  Monitor,
  MapPin,
  AlertTriangle,
  Settings,
  Users,
  Edit,
  Plus,
  Eye,
  EyeOff,
  Download,
  Loader2,
  FileText // Import the icon for PDF
} from 'lucide-react';
import { generateGuidePdf } from '@/api/functions';
import { servePdfInline } from '@/api/functions'; // Import the new function

import EditSectionModal from '../components/guide/EditSectionModal';
import EditContentModal from '../components/guide/EditContentModal';
import PdfPreviewModal from '../components/guide/PdfPreviewModal';

const iconMap = {
  Monitor,
  HardDrive,
  MapPin,
  AlertTriangle,
  Settings,
  Users
};

const colorVariants = {
  purple: 'text-purple-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600'
};

export default function InformationGuide() {
  const [sections, setSections] = useState([]);
  const [contents, setContents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingContentId, setEditingContentId] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddContent, setShowAddContent] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewingPdfUrl, setPreviewingPdfUrl] = useState(null);
  const [inlinePdfUrl, setInlinePdfUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sectionsData, contentsData, userData] = await Promise.all([
        GuideSection.list('order_index'),
        GuideContent.list('order_index'),
        User.me().catch(() => null)
      ]);

      setSections(sectionsData || []);
      setContents(contentsData || []);
      setCurrentUser(userData);

      // Initialize with default content if empty
      if (sectionsData.length === 0) {
        await initializeDefaultContent();
      }
    } catch (error) {
      console.error('Error loading guide data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultContent = async () => {
    try {
      const defaultSections = [
        { title: 'Software & Setup', icon: 'Monitor', color: 'purple', order_index: 1 },
        { title: 'Hardware Management', icon: 'HardDrive', color: 'blue', order_index: 2 },
        { title: 'On-Site Operations', icon: 'MapPin', color: 'emerald', order_index: 3 },
        { title: 'Troubleshooting', icon: 'AlertTriangle', color: 'orange', order_index: 4 }
      ];

      for (const section of defaultSections) {
        await GuideSection.create(section);
      }

      loadData();
    } catch (error) {
      console.error('Error initializing default content:', error);
    }
  };

  const handleSectionSaved = () => {
    setEditingSectionId(null);
    setShowAddSection(false);
    loadData();
  };

  const handleContentSaved = () => {
    setEditingContentId(null);
    setShowAddContent(null);
    loadData();
  };

  const toggleSectionVisibility = async (section) => {
    try {
      await GuideSection.update(section.id, { is_published: !section.is_published });
      loadData();
    } catch (error) {
      console.error('Error toggling section visibility:', error);
    }
  };

  const toggleContentVisibility = async (content) => {
    try {
      await GuideContent.update(content.id, { is_published: !content.is_published });
      loadData();
    } catch (error) {
      console.error('Error toggling content visibility:', error);
    }
  };

  const handleDownload = async (content) => {
    setDownloadingId(content.id);
    try {
      // The backend function returns the raw data of the PDF file
      const response = await generateGuidePdf({ contentId: content.id });

      // We need to get the filename from the Content-Disposition header
      const disposition = response.headers.get('content-disposition');
      let filename = 'guide.pdf';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // `response.data` is expected to be the Blob/ArrayBuffer from the `generateGuidePdf` utility.
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
        console.error("Error downloading PDF:", error);
        // Here you could add a toast notification to inform the user of the error
    } finally {
        setDownloadingId(null);
    }
  };

  const handlePreview = async (fileUrl) => {
    setPreviewingPdfUrl(fileUrl);
    setIsPreviewLoading(true);
    try {
      // The function now returns JSON with a base64 string
      const response = await servePdfInline({ fileUrl });
      if (response.data && response.data.pdf_base64) {
        const dataUrl = `data:application/pdf;base64,${response.data.pdf_base64}`;
        setInlinePdfUrl(dataUrl);
      } else {
        throw new Error("Invalid response from PDF service");
      }
    } catch (error) {
      console.error("Error creating inline PDF URL or serving PDF:", error);
      setInlinePdfUrl(null);
    } finally {
        setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    // No need to revoke an object URL anymore
    setPreviewingPdfUrl(null);
    setInlinePdfUrl(null);
    setIsPreviewLoading(false);
  };

  const getContentForSection = (sectionId) => {
    return contents.filter(content => content.section_id === sectionId && content.is_published)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const isAdmin = currentUser?.role === 'admin';

  const renderContentBlock = (block) => {
    if (!block || typeof block !== 'object') {
      // Fallback for unexpected block structure, render as plain text div
      return <div className="text-gray-600" key={Math.random()}>{block}</div>;
    }

    const baseClasses = "mb-4 last:mb-0";
    // Clean up URL to remove leading dashes or whitespace
    const imageUrl = block.image_url?.trim().replace(/^-+\s*/, '');

    switch (block.type) {
      case 'step':
        return (
          <div key={block.id || Math.random()} className={`${baseClasses} border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg`}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Step illustration"
                className="w-full max-w-md rounded-lg shadow-md mb-3"
                onError={(e) => {
                  console.error("Failed to load step image:", imageUrl);
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="font-medium text-blue-900 mb-2">📋 Step:</div>
            <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: block.content }}></div>
          </div>
        );

      case 'warning':
        return (
          <div key={block.id || Math.random()} className={`${baseClasses} border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-lg`}>
            <div className="font-medium text-red-900 mb-2">⚠️ Warning:</div>
            <div className="text-red-800" dangerouslySetInnerHTML={{ __html: block.content }}></div>
          </div>
        );

      case 'tip':
        return (
          <div key={block.id || Math.random()} className={`${baseClasses} border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg`}>
            <div className="font-medium text-green-900 mb-2">💡 Tip:</div>
            <div className="text-green-800" dangerouslySetInnerHTML={{ __html: block.content }}></div>
          </div>
        );

      case 'image_text':
        return (
          <div key={block.id || Math.random()} className={baseClasses}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Guide illustration"
                className="w-full max-w-lg rounded-lg shadow-md mb-3"
                onError={(e) => {
                  console.error("Failed to load image:", imageUrl);
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: block.content }}></div>
          </div>
        );

      default: // text
        return (
          <div key={block.id || Math.random()} className={`${baseClasses} text-gray-700`} dangerouslySetInnerHTML={{ __html: block.content }}></div>
        );
    }
  };

  const renderContent = (content) => {
    let blocks = [];

    try {
      // Try to parse as JSON blocks first
      // Check if content.answer is a string and starts with a JSON array marker
      if (typeof content.answer === 'string' && content.answer.trim().startsWith('[{')) {
        blocks = JSON.parse(content.answer);
      } else {
        // Fallback to simple content as a single text block
        blocks = [{
          type: 'text',
          content: content.answer || '',
          image_url: content.image_url || ''
        }];
      }
    } catch (e) {
      // If parsing fails, create a simple text block
      console.warn("Failed to parse content as JSON blocks, falling back to plain text:", e);
      blocks = [{
        type: 'text',
        content: content.answer || '',
        image_url: content.image_url || ''
      }];
    }

    return (
      <div className="space-y-3">
        {content.pdf_url && (
          <div className="mb-4">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => handlePreview(content.pdf_url)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview Attached PDF
            </Button>
          </div>
        )}

        {blocks.map((block, index) => renderContentBlock({ ...block, id: index }))}

        {/* PDF Download Button */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(content)}
            disabled={downloadingId === content.id}
          >
            {downloadingId === content.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Download className="w-4 h-4 mr-2" />
            )}
            Download as PDF
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
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
          className="flex items-center justify-between"
        >
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Information Guide
            </h1>
            <p className="text-gray-600 text-lg mt-2">Your complete reference for successful events</p>
          </div>

          {isAdmin && (
            <Button
              onClick={() => setShowAddSection(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          )}
        </motion.div>

        {/* Guide Sections */}
        <div className="space-y-6">
          {sections
            .filter(section => section.is_published || isAdmin)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((section, index) => {
              const IconComponent = iconMap[section.icon] || Monitor;
              const sectionContents = contents.filter(content => content.section_id === section.id && (content.is_published || isAdmin))
                                              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm ${!section.is_published ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className={`flex items-center gap-3 text-2xl font-bold ${colorVariants[section.color]}`}>
                          <IconComponent className="w-6 h-6" />
                          {section.title}
                          {!section.is_published && (
                            <Badge variant="outline" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                        </CardTitle>

                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSectionVisibility(section)}
                            >
                              {section.is_published ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSectionId(section.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAddContent(section.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sectionContents.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {sectionContents.map((content, contentIndex) => (
                            <AccordionItem key={content.id} value={`item-${contentIndex}`}>
                              <AccordionTrigger className="font-semibold text-gray-800 text-left hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span>{content.question}</span>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleContentVisibility(content);
                                        }}
                                      >
                                        {content.is_published ? (
                                          <Eye className="w-3 h-3" />
                                        ) : (
                                          <EyeOff className="w-3 h-3" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingContentId(content.id);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="text-gray-600 pt-4">
                                {renderContent(content)}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No content available for this section.</p>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              onClick={() => setShowAddContent(section.id)}
                              className="mt-4"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Content
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </div>

        {/* Modals */}
        {(showAddSection || editingSectionId) && (
          <EditSectionModal
            isOpen={true}
            onClose={() => {
              setShowAddSection(false);
              setEditingSectionId(null);
            }}
            sectionId={editingSectionId}
            onSaved={handleSectionSaved}
          />
        )}

        {(showAddContent || editingContentId) && (
          <EditContentModal
            isOpen={true}
            onClose={() => {
              setShowAddContent(null);
              setEditingContentId(null);
            }}
            contentId={editingContentId}
            sectionId={showAddContent}
            onSaved={handleContentSaved}
          />
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={!!previewingPdfUrl}
          onClose={handleClosePreview}
          pdfUrl={inlinePdfUrl}
          originalUrl={previewingPdfUrl}
          isLoading={isPreviewLoading}
        />
      </div>
    </div>
  );
}
