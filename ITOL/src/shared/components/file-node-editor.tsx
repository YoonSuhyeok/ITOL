import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { FileNodeData } from './settings-modal/types';

interface FileNodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: FileNodeData;
  onSave: (data: FileNodeData) => void;
  mode: 'create' | 'edit';
}

const defaultFileNodeData: FileNodeData = {
  type: 'file',
  name: '',
  description: '',
  content: '',
};

export const FileNodeEditor: React.FC<FileNodeEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode,
}) => {
  const [data, setData] = useState<FileNodeData>(initialData || defaultFileNodeData);

  // initialData가 변경되면 data state를 업데이트
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    } else {
      setData(defaultFileNodeData);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((prev) => ({
      ...prev,
      name: e.target.value,
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setData((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setData((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create File Node' : 'Edit File Node'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="file-name">File Name</Label>
            <Input
              id="file-name"
              placeholder="Enter file name..."
              value={data.name}
              onChange={handleNameChange}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="file-description">Description</Label>
            <Textarea
              id="file-description"
              placeholder="Enter file description..."
              value={data.description}
              onChange={handleDescriptionChange}
              className="min-h-20"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="file-content">Content</Label>
            <Textarea
              id="file-content"
              placeholder="Enter file content..."
              value={data.content || ''}
              onChange={handleContentChange}
              className="min-h-48 font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
