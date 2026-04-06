import React, { useState, useEffect } from 'react';
import { GuideSection } from '@/api/entities';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const iconOptions = [
  { value: 'Monitor', label: 'Monitor' },
  { value: 'HardDrive', label: 'Hard Drive' },
  { value: 'MapPin', label: 'Map Pin' },
  { value: 'AlertTriangle', label: 'Alert Triangle' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Users', label: 'Users' },
];

const colorOptions = [
  { value: 'purple', label: 'Purple' },
  { value: 'blue', label: 'Blue' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'yellow', label: 'Yellow' },
];

export default function EditSectionModal({ isOpen, onClose, sectionId, onSaved }) {
  const [sectionData, setSectionData] = useState({
    title: '',
    icon: 'Monitor',
    color: 'purple',
    order_index: 0,
    is_published: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sectionId) {
      loadSection();
    } else {
      // Reset for new section
      setSectionData({
        title: '',
        icon: 'Monitor',
        color: 'purple',
        order_index: 0,
        is_published: true
      });
    }
  }, [sectionId]);

  const loadSection = async () => {
    setIsLoading(true);
    try {
      const section = await GuideSection.get(sectionId);
      setSectionData(section);
    } catch (error) {
      console.error('Error loading section:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sectionData.title.trim()) return;

    setIsSubmitting(true);
    try {
      if (sectionId) {
        await GuideSection.update(sectionId, sectionData);
      } else {
        await GuideSection.create(sectionData);
      }
      onSaved();
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setSectionData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {sectionId ? 'Edit Section' : 'Add New Section'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={sectionData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter section title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={sectionData.icon}
                  onValueChange={(value) => updateField('icon', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={sectionData.color}
                  onValueChange={(value) => updateField('color', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Order Index</Label>
              <Input
                id="order"
                type="number"
                value={sectionData.order_index}
                onChange={(e) => updateField('order_index', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                checked={sectionData.is_published}
                onChange={(e) => updateField('is_published', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="published">Published (visible to all users)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sectionId ? 'Update' : 'Create'} Section
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}