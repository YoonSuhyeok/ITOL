import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Link, Unlink, ChevronDown, ChevronUp } from 'lucide-react';
import { NodeReference } from '@/features/dag/types/node-connection.types';
import { DagServiceInstance } from '@/features/dag/services/dag.service';

interface NodeReferencePickerProps {
  nodeId: string;
  currentValue: any;
  currentReference?: {
    nodeId: string;
    path: string;
    display: string;
  };
  onValueChange: (value: any, reference?: { nodeId: string; path: string; display: string }) => void;
  parameterType: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export const NodeReferencePicker: React.FC<NodeReferencePickerProps> = ({
  nodeId,
  currentValue,
  currentReference,
  onValueChange,
  parameterType
}) => {
  const [isReferenceMode, setIsReferenceMode] = useState(!!currentReference);
  const [availableReferences, setAvailableReferences] = useState<NodeReference[]>([]);
  const [selectedReference, setSelectedReference] = useState<string>('');
  const [showReferenceDetails, setShowReferenceDetails] = useState(false);

  useEffect(() => {
    // 사용 가능한 참조 목록 가져오기 (확장된 버전 사용)
    const references = DagServiceInstance.getAvailableReferencesExtended(nodeId, true);
    console.log(`[NodeReferencePicker] Getting references for node ${nodeId}:`, references);
    console.log(`[NodeReferencePicker] Graph nodes:`, DagServiceInstance.getNodeData());
    console.log(`[NodeReferencePicker] Graph edges:`, DagServiceInstance.getEdgeData());
    setAvailableReferences(references);
    
    // 현재 참조가 있다면 선택 상태로 설정
    if (currentReference) {
      const referenceKey = `${currentReference.nodeId}:${currentReference.path}`;
      setSelectedReference(referenceKey);
    }
  }, [nodeId, currentReference]);

  const handleModeToggle = () => {
    setIsReferenceMode(!isReferenceMode);
    if (isReferenceMode) {
      // 참조 모드에서 수동 모드로 변경
      onValueChange(currentValue);
      setSelectedReference('');
    }
  };

  const handleReferenceSelect = (value: string) => {
    setSelectedReference(value);
    
    if (value) {
      const [referenceNodeId, referencePath] = value.split(':');
      const reference = availableReferences.find(
        ref => ref.nodeId === referenceNodeId && ref.field === referencePath
      );
      
      if (reference) {
        onValueChange(null, {
          nodeId: referenceNodeId,
          path: referencePath,
          display: reference.displayPath
        });
      }
    }
  };

  const handleManualValueChange = (value: string) => {
    let parsedValue: any = value;
    
    // 타입에 따른 값 파싱
    switch (parameterType) {
      case 'number':
        parsedValue = value ? parseFloat(value) : null;
        break;
      case 'boolean':
        parsedValue = value === 'true';
        break;
      case 'object':
      case 'array':
        try {
          parsedValue = value ? JSON.parse(value) : null;
        } catch (e) {
          parsedValue = value; // 파싱 실패 시 문자열로 유지
        }
        break;
      default:
        parsedValue = value;
    }
    
    onValueChange(parsedValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">값 설정</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleModeToggle}
          className="flex items-center gap-1"
        >
          {isReferenceMode ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
          {isReferenceMode ? '수동 입력' : '노드 참조'}
        </Button>
      </div>

      {isReferenceMode ? (
        <div className="space-y-2">
          <select 
            value={selectedReference} 
            onChange={(e) => handleReferenceSelect(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">참조할 노드 결과 선택...</option>
            {availableReferences.length === 0 ? (
              <option value="" disabled>
                사용 가능한 참조가 없습니다
              </option>
            ) : (
              availableReferences.map((ref) => (
                <option key={`${ref.nodeId}:${ref.field}`} value={`${ref.nodeId}:${ref.field}`}>
                  {ref.displayPath}
                </option>
              ))
            )}
          </select>
          
          {currentReference && (
            <div className="p-2 bg-blue-50 rounded border">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  참조 중: {currentReference.display}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReferenceDetails(!showReferenceDetails)}
                >
                  {showReferenceDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
              
              {showReferenceDetails && (
                <div className="mt-2 text-xs text-gray-600">
                  <div>노드 ID: {currentReference.nodeId}</div>
                  <div>경로: {currentReference.path}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {parameterType === 'boolean' ? (
            <select 
              value={currentValue?.toString() || 'false'} 
              onChange={(e) => handleManualValueChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <Input
              value={
                parameterType === 'object' || parameterType === 'array'
                  ? JSON.stringify(currentValue, null, 2)
                  : currentValue?.toString() || ''
              }
              onChange={(e) => handleManualValueChange(e.target.value)}
              placeholder={`${parameterType} 값을 입력하세요...`}
              className={parameterType === 'object' || parameterType === 'array' ? 'font-mono text-sm' : ''}
            />
          )}
        </div>
      )}
    </div>
  );
};
