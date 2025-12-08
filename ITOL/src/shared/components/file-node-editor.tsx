import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '../lib/utils';
import { ChevronsUpDown, Check } from 'lucide-react';
import { DagServiceInstance } from '@/features/dag/services/dag.service';
import type { FileNodeData } from './settings-modal/types';

interface FileNodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: FileNodeData;
  onSave: (data: FileNodeData) => void;
  mode: 'create' | 'edit';
  nodeId?: string;  // 이전 노드 참조를 위한 현재 노드 ID
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
  nodeId,
}) => {
  const [data, setData] = useState<FileNodeData>(initialData || defaultFileNodeData);
  const [openReferencePopover, setOpenReferencePopover] = useState(false);

  // 이전 노드 참조 목록 가져오기
  const availableReferences = useMemo(() => {
    console.log('[File Node Editor] Computing available references for node:', nodeId);
    if (!nodeId) return [];
    try {
      const refs = DagServiceInstance.getAvailableReferencesExtended(nodeId, true);
      console.log('[File Node Editor] Available references (before dedup):', refs);
      
      // Deduplicate by nodeId.field combination
      const uniqueRefs = refs.reduce((acc, ref) => {
        const key = `${ref.nodeId}.${ref.field}`;
        if (!acc.some(r => `${r.nodeId}.${r.field}` === key)) {
          acc.push(ref);
        }
        return acc;
      }, [] as typeof refs);
      
      console.log('[File Node Editor] Available references (after dedup):', uniqueRefs);
      return uniqueRefs;
    } catch (e) {
      console.error('Failed to get available references:', e);
      return [];
    }
  }, [nodeId]);

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
            <div className="flex items-center justify-between">
              <Label htmlFor="file-content">Content</Label>
              {nodeId && availableReferences.length > 0 && (
                <Popover open={openReferencePopover} onOpenChange={setOpenReferencePopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      role="combobox"
                      aria-expanded={openReferencePopover}
                      className="h-8 text-xs"
                    >
                      <ChevronsUpDown className="mr-2 h-3 w-3" />
                      Previous Node Results
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 bg-white border shadow-md rounded-md" align="end">
                    <Command>
                      <CommandInput placeholder="Search previous node results..." />
                      <CommandList>
                        <CommandEmpty>No previous node results found.</CommandEmpty>
                        <CommandGroup>
                          {availableReferences.map((ref) => (
                            <CommandItem
                              key={`${ref.nodeId}-${ref.field}`}
                              value={`${ref.nodeId}.${ref.field}`}
                              onSelect={() => {
                                const referenceText = `{{${ref.nodeId}.${ref.field}}}`;
                                setData((prev) => ({
                                  ...prev,
                                  content: (prev.content || '') + referenceText,
                                }));
                                setOpenReferencePopover(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.content?.includes(`{{${ref.nodeId}.${ref.field}}}`) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{ref.displayPath}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
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
