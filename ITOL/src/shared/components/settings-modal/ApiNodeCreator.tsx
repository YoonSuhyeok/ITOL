import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { ApiNodeData } from '@/entities/language/model/api-node-type';

interface ApiNodeCreatorProps {
  onCreateNode: (apiData: ApiNodeData) => void;
  onCancel: () => void;
}

export const ApiNodeCreator: React.FC<ApiNodeCreatorProps> = ({ onCreateNode, onCancel }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleCreate = () => {
    if (!url.trim() || !name.trim()) {
      alert('이름과 URL을 입력해주세요.');
      return;
    }
    
    const apiData: ApiNodeData = {
      name,
      url,
      method: 'GET',
      headers: [],
      queryParams: [],
      bodyType: 'none',
      auth: { type: 'none' },
      description: '',
      isLoading: false
    };
    
    onCreateNode(apiData);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">API Node 생성</h2>
        <p className="text-sm text-gray-600">API 요청 노드를 생성합니다.</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Node Name</label>
        <Input 
          placeholder="예: Get Users API"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">URL</label>
        <Input 
          placeholder="https://api.example.com/users"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleCreate}>
          생성
        </Button>
      </div>
    </div>
  );
};
