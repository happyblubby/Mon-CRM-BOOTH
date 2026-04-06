import React, { useState, useEffect } from 'react';
import { GuideSection, GuideContent, User } from '@/api/entities';
import { UploadFile, GenerateImage } from '@/api/integrations';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Save, 
  Plus, 
  Upload, 
  Image as ImageIcon, 
  Type, 
  Wand2,
  Eye,
  EyeOff,
  Trash2,
  GripVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VisualGuideEditor() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Guide structure
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [contents, setContents] = useState([]);

  // Form states
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    icon: 'Monitor',
    color: 'purple',
    order_index: 0
  });

  const [newContentData, setNewContentData] = useState({
    question: '',
    content_blocks: [{
      type: 'text',
      content: '',
      image_url: ''
    }]
  });

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
      
      if (sectionsData.length > 0) {
        setActiveSection(sectionsData[0]);
      }
    } catch (error) {
      console.error('Error loading guide data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionData.title.trim()) return;
    
    setIsSaving(true);
    try {
      const sectionData = {
        ...newSectionData,
        order_index: sections.length,
        is_published: true
      };

      const newSection = await GuideSection.create(sectionData);
      setSections([...sections, newSection]);
      setActiveSection(newSection);
      
      // Reset form
      setNewSectionData({
        title: '',
        icon: 'Monitor', 
        color: 'purple',
        order_index: 0
      });
    } catch (error) {
      console.error('Error creating section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateContent = async () => {
    if (!newContentData.question.trim() || !activeSection) return;
    
    setIsSaving(true);
    try {
      const contentData = {
        section_id: activeSection.id,
        question: newContentData.question,
        answer: JSON.stringify(newContentData.content_blocks),
        content_type: 'step_by_step',
        order_index: contents.filter(c => c.section_id === activeSection.id).length,
        is_published: true
      };

      const newContent = await GuideContent.create(contentData);
      setContents([...contents, newContent]);
      
      // Reset form
      setNewContentData({
        question: '',
        content_blocks: [{
          type: 'text',
          content: '',
          image_url: ''
        }]
      });
    } catch (error) {
      console.error('Error creating content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file, blockIndex) => {
    try {
      const { file_url } = await UploadFile({ file });
      updateContentBlock(blockIndex, 'image_url', file_url);
      updateContentBlock(blockIndex, 'type', 'image_text');
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleGenerateImage = async (blockIndex) => {
    const block = newContentData.content_blocks[blockIndex];
    if (!block.content.trim()) return;

    try {
      const { url } = await GenerateImage({ 
        prompt: `Professional photobooth setup guide illustration: ${block.content}` 
      });
      updateContentBlock(blockIndex, 'image_url', url);
      updateContentBlock(blockIndex, 'type', 'image_text');
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const updateContentBlock = (index, field, value) => {
    setNewContentData(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.map((block, i) => 
        i === index ? { ...block, [field]: value } : block
      )
    }));
  };

  const addContentBlock = (type = 'text') => {
    setNewContentData(prev => ({
      ...prev,
      content_blocks: [...prev.content_blocks, {
        type,
        content: '',
        image_url: ''
      }]
    }));
  };

  const removeContentBlock = (index) => {
    if (newContentData.content_blocks.length > 1) {
      setNewContentData(prev => ({
        ...prev,
        content_blocks: prev.content_blocks.filter((_, i) => i !== index)
      }));
    }
  };

  const getContentsForSection = (sectionId) => {
    return contents.filter(content => content.section_id === sectionId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
                Visual Guide Editor
              </h1>
              <p className="text-gray-600 text-lg mt-2">Create beautiful step-by-step guides</p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate(createPageUrl("InformationGuide"))}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Guide
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sections Panel */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5" />
                  Guide Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create New Section */}
                <div className="space-y-3 p-4 bg-purple-50 rounded-xl">
                  <Input
                    placeholder="Section title..."
                    value={newSectionData.title}
                    onChange={(e) => setNewSectionData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                  />
                  <div className="flex gap-2">
                    <Select
                      value={newSectionData.icon}
                      onValueChange={(value) => setNewSectionData(prev => ({
                        ...prev,
                        icon: value
                      }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monitor">Monitor</SelectItem>
                        <SelectItem value="HardDrive">Hard Drive</SelectItem>
                        <SelectItem value="MapPin">Map Pin</SelectItem>
                        <SelectItem value="AlertTriangle">Alert</SelectItem>
                        <SelectItem value="Settings">Settings</SelectItem>
                        <SelectItem value="Users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newSectionData.color}
                      onValueChange={(value) => setNewSectionData(prev => ({
                        ...prev,
                        color: value
                      }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="emerald">Emerald</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateSection}
                    disabled={!newSectionData.title.trim() || isSaving}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {/* Existing Sections */}
                <div className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      onClick={() => setActiveSection(section)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        activeSection?.id === section.id
                          ? 'bg-purple-100 border-2 border-purple-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${section.color}-500`} />
                        <span className="font-medium text-gray-900">{section.title}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {getContentsForSection(section.id).length}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  {activeSection ? `Content for "${activeSection.title}"` : 'Select a section to edit'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSection ? (
                  <div className="space-y-6">
                    {/* Create New Content */}
                    <div className="space-y-4 p-6 bg-emerald-50 rounded-xl">
                      <Input
                        placeholder="Content title or question..."
                        value={newContentData.question}
                        onChange={(e) => setNewContentData(prev => ({
                          ...prev,
                          question: e.target.value
                        }))}
                      />

                      {/* Content Blocks */}
                      <div className="space-y-4">
                        {newContentData.content_blocks.map((block, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Select
                                  value={block.type}
                                  onValueChange={(value) => updateContentBlock(index, 'type', value)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">📝 Text</SelectItem>
                                    <SelectItem value="image_text">🖼️ Image + Text</SelectItem>
                                    <SelectItem value="step">📋 Step</SelectItem>
                                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                                    <SelectItem value="tip">💡 Tip</SelectItem>
                                  </SelectContent>
                                </Select>

                                {newContentData.content_blocks.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeContentBlock(index)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              {(block.type === 'image_text' || block.type === 'step') && (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <label htmlFor={`upload-${index}`} className="cursor-pointer">
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload
                                    </label>
                                  </Button>
                                  <input
                                    id={`upload-${index}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, index);
                                    }}
                                    className="hidden"
                                  />
                                  
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateImage(index)}
                                    disabled={!block.content.trim()}
                                  >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Generate AI Image
                                  </Button>

                                  {block.image_url && (
                                    <img
                                      src={block.image_url}
                                      alt="Preview"
                                      className="w-16 h-16 object-cover rounded border ml-2"
                                    />
                                  )}
                                </div>
                              )}

                              <Textarea
                                placeholder="Enter content..."
                                value={block.content}
                                onChange={(e) => updateContentBlock(index, 'content', e.target.value)}
                                className="min-h-20"
                              />
                            </div>
                          </Card>
                        ))}

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addContentBlock('text')}
                          >
                            <Type className="w-4 h-4 mr-2" />
                            Add Text
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addContentBlock('image_text')}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Add Image
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addContentBlock('step')}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Step
                          </Button>
                        </div>
                      </div>

                      <Button 
                        onClick={handleCreateContent}
                        disabled={!newContentData.question.trim() || isSaving}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Content
                      </Button>
                    </div>

                    {/* Existing Content List */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Existing Content ({getContentsForSection(activeSection.id).length})
                      </h3>
                      {getContentsForSection(activeSection.id).map((content) => (
                        <Card key={content.id} className="p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{content.question}</h4>
                              <p className="text-sm text-gray-500">
                                {content.is_published ? 'Published' : 'Draft'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Type className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a section to start creating content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}