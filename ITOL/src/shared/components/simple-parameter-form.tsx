import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Plus, Trash2, ChevronsUpDown, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { DagServiceInstance } from '@/features/dag/services/dag.service';

// 단순화된 파라미터 타입
export interface SimpleParameter {
  id: string;
  key: string;
  value: string;  // 직접 값 또는 {{nodeId.field}} 형태의 참조
}

interface SimpleParameterFormProps {
  nodeId: string;
  parameters: SimpleParameter[];
  onParametersChange: (parameters: SimpleParameter[]) => void;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  isMinimized?: boolean;
}

// 참조 정보 타입
interface NodeReference {
  nodeId: string;
  nodeName: string;
  field: string;
  displayPath: string;
}

export const SimpleParameterForm: React.FC<SimpleParameterFormProps> = ({
  nodeId,
  parameters,
  onParametersChange,
  isCollapsed = false,
  onCollapseChange,
  isMinimized = false,
}) => {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  // 이전 노드 참조 목록 가져오기
  const availableReferences = useMemo(() => {
    if (!nodeId) return [];
    
    try {
      const nodeData = DagServiceInstance.getNodeData();
      const edgeData = DagServiceInstance.getEdgeData();
      
      // 현재 노드로 들어오는 엣지의 source 노드들
      const incomingEdges = edgeData.filter(edge => edge.target === nodeId);
      const sourceNodeIds = [...new Set(incomingEdges.map(edge => edge.source))];
      
      // 연결된 노드가 없으면 모든 노드 사용
      const targetNodeIds = sourceNodeIds.length > 0 
        ? sourceNodeIds 
        : nodeData.filter(n => n.id !== nodeId).map(n => n.id);
      
      const refs: NodeReference[] = [];
      
      for (const srcNodeId of targetNodeIds) {
        const srcNode = nodeData.find(n => n.id === srcNodeId);
        if (srcNode) {
          const nodeName = srcNode.data?.fileName || srcNode.data?.name || srcNodeId;
          
          // 기본 result 참조
          refs.push({
            nodeId: srcNodeId,
            nodeName,
            field: 'result',
            displayPath: `${nodeName} → result`
          });
          
          // result.data 참조 (API 응답용)
          refs.push({
            nodeId: srcNodeId,
            nodeName,
            field: 'result.data',
            displayPath: `${nodeName} → result.data`
          });
        }
      }
      
      return refs;
    } catch (e) {
      console.error('Failed to get references:', e);
      return [];
    }
  }, [nodeId]);

  // 파라미터 추가
  const addParameter = () => {
    const newParam: SimpleParameter = {
      id: `param-${Date.now()}`,
      key: '',
      value: ''
    };
    onParametersChange([...parameters, newParam]);
  };

  // 파라미터 삭제
  const removeParameter = (id: string) => {
    onParametersChange(parameters.filter(p => p.id !== id));
  };

  // 파라미터 업데이트
  const updateParameter = (id: string, field: 'key' | 'value', newValue: string) => {
    onParametersChange(
      parameters.map(p => p.id === id ? { ...p, [field]: newValue } : p)
    );
  };

  // 참조 선택 시 value에 추가
  const selectReference = (paramId: string, ref: NodeReference) => {
    const referenceText = `{{${ref.nodeId}.${ref.field}}}`;
    updateParameter(paramId, 'value', referenceText);
    setOpenPopoverId(null);
  };

  // 값이 참조인지 확인
  const isReference = (value: string) => {
    return /\{\{.+\}\}/.test(value);
  };

  if (isMinimized) {
    return null;
  }

  return (
    <div className="border-t">
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer"
        onClick={() => onCollapseChange?.(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">Parameter</span>
          {parameters.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {parameters.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            addParameter();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {/* 파라미터 목록 */}
      {!isCollapsed && (
        <div className="p-2 space-y-2">
          {parameters.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No parameters. Click "Add" to create one.
            </div>
          ) : (
            parameters.map((param) => (
              <div key={param.id} className="flex items-start gap-2 p-2 border rounded bg-white">
                {/* Key 입력 */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <Input
                    placeholder="parameter name"
                    value={param.key}
                    onChange={(e) => updateParameter(param.id, 'key', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Value 입력 + 참조 선택 */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="value or {{node.result}}"
                      value={param.value}
                      onChange={(e) => updateParameter(param.id, 'value', e.target.value)}
                      className={cn(
                        "h-8 text-sm flex-1",
                        isReference(param.value) && "text-blue-600 font-mono text-xs"
                      )}
                    />
                    
                    {/* 참조 선택 드롭다운 */}
                    {availableReferences.length > 0 && (
                      <Popover 
                        open={openPopoverId === param.id} 
                        onOpenChange={(open) => setOpenPopoverId(open ? param.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            title="Select reference"
                          >
                            <ChevronsUpDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[300px] p-0 bg-white border shadow-lg rounded-md z-50" 
                          align="end"
                        >
                          <Command>
                            <CommandInput placeholder="Search nodes..." />
                            <CommandList>
                              <CommandEmpty>No nodes found.</CommandEmpty>
                              <CommandGroup heading="Previous Node Results">
                                {availableReferences.map((ref) => (
                                  <CommandItem
                                    key={`${ref.nodeId}-${ref.field}`}
                                    value={`${ref.nodeId}.${ref.field}`}
                                    onSelect={() => selectReference(param.id, ref)}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        param.value === `{{${ref.nodeId}.${ref.field}}}` 
                                          ? "opacity-100" 
                                          : "opacity-0"
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
                  
                  {/* 참조 미리보기 */}
                  {isReference(param.value) && (
                    <div className="mt-1 text-xs text-blue-500">
                      📎 Node reference
                    </div>
                  )}
                </div>

                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-muted-foreground hover:text-destructive"
                  onClick={() => removeParameter(param.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleParameterForm;
