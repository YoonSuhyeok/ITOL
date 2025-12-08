import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, X, Link, Unlink, GitBranch } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Input } from "./ui/input";

import Parameter from "../types/node-parameter-type";
import { RequestBody, RequestProperty} from "../types/request-type";
import { cn } from "../lib/utils";
import { Checkbox } from "./ui/checkbox";
import { DagServiceInstance } from "@/features/dag/services/dag.service";
import { getAvailableNodeReferencesExtended } from "@/features/dag/utils/node-reference.utils";

// 키 선택 처리
function handleKeySelect(
  paramId: string, 
  key: string | null, 
  type: "string" | "number" | "boolean" | "object" | "array", 
  nodeName: string | undefined, 
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, 
  setOpenPopover: React.Dispatch<React.SetStateAction<string | null>>,
  currentKey?: string | null
) {
    // key가 null이면 선택 해제
    if (key === null) {
      setParameters((prev) =>
        prev.map((param) =>
          param.id === paramId
            ? {
                ...param,
                key: null,
                value: null,
                type: "string",
                checked: false,
                valueSource: "linked" as const,
                sourceNodeId: "",
                sourceNodeLabel: "",
              }
            : param,
        )
      );
      setOpenPopover(null);
      return;
    }

    // 현재 선택된 키와 같은 키를 다시 클릭하면 해제
    if (currentKey && currentKey === key) {
      setParameters((prev) =>
        prev.map((param) =>
          param.id === paramId
            ? {
                ...param,
                key: null,
                value: null,
                type: "string",
                checked: false,
                valueSource: "linked" as const,
                sourceNodeId: "",
                sourceNodeLabel: "",
              }
            : param,
        )
      );
      setOpenPopover(null);
      return;
    }
    
    if(nodeName === undefined) {
      setParameters((prev) =>
        prev.map((param) =>
          param.id === paramId
            ? {
                ...param,
                key,
                type,
                checked: true,
              }
            : param,
        )
      )
    } else  {
      setParameters((prev) =>
        prev.map((param) =>
          param.id === paramId
            ? {
                ...param,
                key,
                type,
                checked: true,
                valueSource: "linked" as const
              }
            : param,
        )
      )
    }

    // 팝오버 닫기
    setOpenPopover(null);
}

// 값 선택 처리
function handleValueSelect(
  paramId: string, 
  value: string | null, 
  sourceNodeId: string | undefined,
  sourceNodeLabel: string | undefined,
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, 
  setOpenPopover: React.Dispatch<React.SetStateAction<string | null>>
) {
    if (!value) return;
    
    setParameters((prev) =>
      prev.map((param) =>
        param.id === paramId
          ? {
              ...param,
              value,
              sourceNodeId: sourceNodeId || "",
              sourceNodeLabel: sourceNodeLabel || "",
              valueSource: "linked" as const,
              checked: true,
            }
          : param,
      )
    );

    // 팝오버 닫기
    setOpenPopover(null);
}

// 노드 참조 선택 처리 (새로운 기능)
function handleNodeReferenceSelect(
  paramId: string,
  referenceNodeId: string,
  referencePath: string,
  displayReference: string,
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>,
  setOpenPopover: React.Dispatch<React.SetStateAction<string | null>>
) {
  setParameters((prev) =>
    prev.map((param) =>
      param.id === paramId
        ? {
            ...param,
            value: null, // 실제 값은 실행 시 해석됨
            valueSource: "reference" as const,
            referenceNodeId,
            referencePath,
            displayReference,
            checked: true,
          }
        : param,
    )
  );

  // 팝오버 닫기
  setOpenPopover(null);
}

// 값 소스 변경 처리 (확장)
function handleValueSourceChange(
  paramId: string, 
  source: "linked" | "dynamic" | "reference", 
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>
) {
  setParameters((prev) =>
    prev.map((param) =>
      param.id === paramId
        ? {
            ...param,
            valueSource: source,
            // 소스 변경 시 관련 필드 초기화
            ...(source === "dynamic" 
              ? { 
                  sourceNodeId: "", 
                  sourceNodeLabel: "", 
                  referenceNodeId: undefined,
                  referencePath: undefined,
                  displayReference: undefined
                }
              : source === "linked"
              ? {
                  referenceNodeId: undefined,
                  referencePath: undefined,
                  displayReference: undefined
                }
              : {
                  sourceNodeId: "",
                  sourceNodeLabel: "",
                  value: null
                }
            )
          }
        : param,
    )
  );
}

// 파라미터 삭제 함수
function deleteParameter(
  id: string, 
  parameters: Parameter[], 
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, 
  setIsParameterSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>,
  nodeId: string
) {
    setParameters((prev) => {
      const updatedParams = prev.filter((param) => param.id !== id);
      // DagService에도 즉시 저장
      DagServiceInstance.setNodeParameters(nodeId, updatedParams);
      return updatedParams;
    });

    if(parameters.length === 1) { // 삭제 후 0개가 되는 경우
      setIsParameterSectionCollapsed(false); // 파라미터가 없으면 섹션을 최소화
    }
}

const ParameterForm = ({
    nodeId,
    isParameterSectionCollapsed,
    setIsParameterSectionCollapsed,
    parent_parameters,
    isNodeMinimized
}: {
    nodeId: string;
    isParameterSectionCollapsed: boolean;
    setIsParameterSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    parent_parameters: RequestProperty[];
    isNodeMinimized: boolean;
}) => {
    
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [frontParameters, setFrontParameters] = useState<Parameter[]>([]);

    useEffect(() => {
      const frontParameters = DagServiceInstance.getFrontNodeParameters(nodeId);
      setFrontParameters(frontParameters);
      setParameters(DagServiceInstance.getNodeParameters(nodeId));
    }, [nodeId]);

    // 파라미터가 변경될 때마다 DagService에 저장
    useEffect(() => {
      DagServiceInstance.setNodeParameters(nodeId, parameters);
    }, [nodeId, parameters]);
                  
    const [openKeyPopover, setOpenKeyPopover] = useState<string | null>(null);

    const [openValuePopover, setOpenValuePopover] = useState<string | null>(null);
    const [requestType] = useState<RequestBody>({
      properties: parent_parameters
    });

    // 사용자 정의 파라미터 입력 상태
    const [customKeyInput, setCustomKeyInput] = useState<{ [paramId: string]: string }>({});
    const [customValueInput, setCustomValueInput] = useState<{ [paramId: string]: string }>({});

    // 이미 선택된 키들을 필터링하는 함수
    const getAvailableKeys = useCallback((currentParamId: string) => {
      const selectedKeys = parameters
        .filter(p => p.id !== currentParamId && p.key)
        .map(p => p.key);
      
      return requestType.properties.filter(prop => !selectedKeys.includes(prop.key));
    }, [parameters, requestType.properties]);

    // 이미 선택된 값들을 필터링하는 함수
    const getAvailableValues = useCallback((currentParamId: string) => {
      const selectedKeys = parameters
        .filter(p => p.id !== currentParamId && p.key)
        .map(p => p.key);
      
      return frontParameters.filter(prop => !selectedKeys.includes(prop.key));
    }, [parameters, frontParameters]);

    // 사용자 정의 키 추가 처리
    const handleCustomKeyAdd = useCallback((paramId: string, customKey: string) => {
      if (customKey.trim()) {
        const currentParam = parameters.find(p => p.id === paramId);
        handleKeySelect(paramId, customKey.trim(), "string", undefined, setParameters, setOpenKeyPopover, currentParam?.key);
        setCustomKeyInput(prev => ({ ...prev, [paramId]: '' }));
      }
    }, [parameters]);

    // 사용자 정의 값 추가 처리
    const handleCustomValueAdd = useCallback((paramId: string, customValue: string) => {
      if (customValue.trim()) {
        const currentParam = parameters.find(p => p.id === paramId);
        if (currentParam) {
          setParameters(prev => {
            const updatedParams = prev.map(param =>
              param.id === paramId
                ? {
                    ...param,
                    value: customValue.trim(),
                    valueSource: "dynamic" as const,
                    checked: true
                  }
                : param
            );
            // DagService에도 즉시 저장
            DagServiceInstance.setNodeParameters(nodeId, updatedParams);
            return updatedParams;
          });
        }
        setCustomValueInput(prev => ({ ...prev, [paramId]: '' }));
        setOpenValuePopover(null);
      }
    }, [parameters, nodeId]);

    // 키 선택 드롭다운 열기/닫기 처리
    const handleKeyPopoverOpenChange = useCallback((paramId: string, open: boolean) => {
        if (open) {
        setOpenKeyPopover(paramId)
        } else {
        setOpenKeyPopover(null)
        }
    }, [])

    // 키 선택 드롭다운 열기/닫기 처리
    const handleValuePopoverOpenChange = useCallback((paramId: string, open: boolean) => {
        if (open) {
        setOpenValuePopover(paramId)
        } else {
        setOpenValuePopover(null)
        }
    }, [])

  const handleParameterChange = useCallback(
    (key: string | null, field: keyof Parameter, value: any) => {
      setParameters((prev) => {
        const updatedParams = prev.map((param) => (param.key === key ? { ...param, [field]: value } : param));
        // DagService에도 즉시 저장
        DagServiceInstance.setNodeParameters(nodeId, updatedParams);
        console.log(`Parameter ${field} changed for ${key}:`, value);
        return updatedParams;
      });
    },
    [nodeId]
  );

  const addParameter = useCallback(() => {
    const newParameter: Parameter = {
      id: `param-${Date.now()}`,
      enabled: true,
      key: null,
      value: null,
      checked: false,
      type: "string", // 기본 타입은 string
      valueSource: "linked", // 기본 값 소스는 linked
      sourcePath: "",
      sourceNodeLabel: "",
      sourceNodeId: ""
    };
    
    setParameters((prev) => {
      const updatedParams = [...prev, newParameter];
      // DagService에도 즉시 저장
      DagServiceInstance.setNodeParameters(nodeId, updatedParams);
      return updatedParams;
    });
  }, [nodeId]);


    return (
        <div style={{ display: isNodeMinimized ? 'none' : 'block' }}>
            <div className="flex justify-between items-center mb-4">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsParameterSectionCollapsed(!isParameterSectionCollapsed)}
              >
                {isParameterSectionCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <h3 className="text-lg font-medium">Parameter</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addParameter}>
                  Add Parameter
                </Button>
              </div>
            </div>
            {!isParameterSectionCollapsed && (
                <div className="border rounded-md">
                    {/* 헤더 행 */}
                    <div className="grid grid-cols-[40px_1fr_1fr_40px] border-b">
                    <div className="p-3"></div>
                    <div className="p-3 font-medium">Key</div>
                    <div className="p-3 font-medium">Value</div>
                    <div className="p-3"></div>
                </div>
                    
              {/* 파라미터 행 */}
              {parameters.map((param) => (
                <div key={param.id} className="grid grid-cols-[40px_1fr_1fr_40px] border-b last:border-b-0">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={param.checked}
                      onCheckedChange={(checked) => handleParameterChange(param.key, "checked", checked)}
                    />
                  </div>
                  <div className="p-2">
                    <Popover
                        open={openKeyPopover === param.id}
                        onOpenChange={(open) => handleKeyPopoverOpenChange(param.id, open)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between">
                            <div className="flex items-center">
                              {param.key || "Select key..."}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 border border-black rounded">
                          <Command>
                            <CommandInput placeholder="Search key..." />
                            <CommandList>
                              <CommandEmpty>
                                <Input></Input>
                              </CommandEmpty>
                              <CommandGroup>
                                {getAvailableKeys(param.id).map((prop, index) => (
                                    <CommandItem
                                      key={`key-${param.id}-${prop.key}-${prop.nodeName || 'no-node'}-${index}`}
                                      value={prop.key}
                                      onSelect={() => handleKeySelect(param.id, prop.key, prop.type, prop.nodeName, setParameters, setOpenKeyPopover, param.key)}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              param.key === prop.key ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {prop.key}
                                          {prop.description && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              {prop.nodeName ? `(${prop.nodeName}) ` : ""}
                                              {prop.description}
                                            </span>
                                          )}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {prop.type}
                                        </Badge>
                                      </div>
                                    </CommandItem>
                                ))}
                                {getAvailableKeys(param.id).length === 0 && (
                                  <CommandItem disabled>
                                    <span className="text-gray-500">모든 파라미터가 이미 선택됨</span>
                                  </CommandItem>
                                )}
                              </CommandGroup>
                              <div className="p-2 border-t">
                                <Input
                                  placeholder="새 파라미터 이름 입력..."
                                  value={customKeyInput[param.id] || ''}
                                  onChange={(e) => setCustomKeyInput(prev => ({ ...prev, [param.id]: e.target.value }))}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCustomKeyAdd(param.id, customKeyInput[param.id] || '');
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="mt-1 w-full"
                                  onClick={() => handleCustomKeyAdd(param.id, customKeyInput[param.id] || '')}
                                  disabled={!customKeyInput[param.id]?.trim()}
                                >
                                  추가
                                </Button>
                              </div>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                  </div>
                  <div className="p-2">
                    <ValueSelector 
                      param={param}
                      nodeId={nodeId}
                      availableValues={getAvailableValues(param.id)}
                      onParameterUpdate={(updatedParam) => {
                        setParameters(prev => {
                          const updatedParams = prev.map(p => p.id === param.id ? updatedParam : p);
                          DagServiceInstance.setNodeParameters(nodeId, updatedParams);
                          return updatedParams;
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteParameter(param.id, parameters, setParameters, setIsParameterSectionCollapsed, nodeId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
                </div>
            )}
        </div>
    );
}

// ValueSelector 컴포넌트 - 3가지 값 입력 모드 지원
const ValueSelector = ({ 
  param, 
  nodeId,
  availableValues,
  onParameterUpdate 
}: {
  param: Parameter;
  nodeId: string;
  availableValues: any[];
  onParameterUpdate: (updatedParam: Parameter) => void;
}) => {
  const [valueMode, setValueMode] = useState<"linked" | "dynamic" | "reference">(
    param.valueSource as "linked" | "dynamic" | "reference" || "dynamic"
  );
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [availableReferences, setAvailableReferences] = useState<any[]>([]);

  // 사용 가능한 노드 참조 목록 가져오기
  useEffect(() => {
    console.log(`[ValueSelector] ===== Starting reference lookup for node ${nodeId} =====`);
    try {
      const nodeData = DagServiceInstance.getNodeData();
      const edgeData = DagServiceInstance.getEdgeData();
      
      console.log(`[ValueSelector] Node data:`, nodeData);
      console.log(`[ValueSelector] Edge data:`, edgeData);
      
      const references = getAvailableNodeReferencesExtended(nodeId, 
        nodeData, 
        edgeData,
        true // 모든 성공한 노드 포함
      );
      console.log(`[ValueSelector] Got references (before dedup):`, references);
      
      // Deduplicate by nodeId.field combination
      const uniqueRefs = references.reduce((acc, ref) => {
        const key = `${ref.nodeId}.${ref.field}`;
        if (!acc.some(r => `${r.nodeId}.${r.field}` === key)) {
          acc.push(ref);
        }
        return acc;
      }, [] as typeof references);
      
      console.log(`[ValueSelector] Got references (after dedup):`, uniqueRefs);
      console.log(`[ValueSelector] Setting availableReferences to ${uniqueRefs.length} items`);
      setAvailableReferences(uniqueRefs);
    } catch (error) {
      console.error('[ValueSelector] Error getting references:', error);
      setAvailableReferences([]);
    }
    console.log(`[ValueSelector] ===== Finished reference lookup =====`);
  }, [nodeId]);

  // 모드 변경 핸들러
  const handleModeChange = (newMode: "linked" | "dynamic" | "reference") => {
    const updatedParam = {
      ...param,
      valueSource: newMode,
      value: newMode === "reference" ? null : param.value,
      referenceNodeId: newMode === "reference" ? param.referenceNodeId : undefined,
      referencePath: newMode === "reference" ? param.referencePath : undefined,
      displayReference: newMode === "reference" ? param.displayReference : undefined,
    };
    
    setValueMode(newMode);
    onParameterUpdate(updatedParam);
    setShowModeSelector(false);
  };

  // 노드 참조 선택 핸들러
  const handleReferenceSelect = (referenceKey: string) => {
    const [referenceNodeId, referencePath] = referenceKey.split(':');
    const reference = availableReferences.find(
      ref => ref.nodeId === referenceNodeId && ref.field === referencePath
    );
    
    if (reference) {
      const updatedParam = {
        ...param,
        valueSource: "reference" as const,
        value: null,
        referenceNodeId,
        referencePath,
        displayReference: reference.displayPath,
      };
      onParameterUpdate(updatedParam);
    }
  };

  const renderModeIcon = () => {
    switch (valueMode) {
      case "linked": return <GitBranch className="h-3 w-3" />;
      case "reference": return <Link className="h-3 w-3" />;
      default: return <Unlink className="h-3 w-3" />;
    }
  };

  const renderModeLabel = () => {
    switch (valueMode) {
      case "linked": return "이전 노드 키";
      case "reference": return "노드 결과 참조";
      default: return "직접 입력";
    }
  };

  return (
    <div className="space-y-2">
      {/* 모드 선택 버튼 */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {renderModeIcon()}
          <span className="ml-1">{renderModeLabel()}</span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowModeSelector(!showModeSelector)}
          className="h-6 px-2 text-xs"
        >
          <ChevronsUpDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 모드 선택 드롭다운 */}
      {showModeSelector && (
        <div className="p-2 border rounded bg-white shadow-sm space-y-1">
          <Button
            variant={valueMode === "dynamic" ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => handleModeChange("dynamic")}
          >
            <Unlink className="h-3 w-3 mr-2" />
            직접 입력
          </Button>
          {availableValues.length > 0 && (
            <Button
              variant={valueMode === "linked" ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handleModeChange("linked")}
            >
              <GitBranch className="h-3 w-3 mr-2" />
              이전 노드 키
            </Button>
          )}
          {availableReferences.length > 0 && (
            <Button
              variant={valueMode === "reference" ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handleModeChange("reference")}
            >
              <Link className="h-3 w-3 mr-2" />
              노드 결과 참조
            </Button>
          )}
        </div>
      )}

      {/* 값 입력 UI */}
      {valueMode === "dynamic" && (
        <Input
          placeholder="직접 값 입력..."
          disabled={param.key === null}
          value={param.value || ''}
          onChange={(e) => {
            const updatedParam = {
              ...param,
              value: e.target.value,
              valueSource: "dynamic" as const
            };
            onParameterUpdate(updatedParam);
          }}
        />
      )}

      {valueMode === "linked" && availableValues.length > 0 && (
        <select
          value={param.value || ''}
          onChange={(e) => {
            const selectedValue = availableValues.find(v => v.key === e.target.value);
            if (selectedValue) {
              const updatedParam = {
                ...param,
                value: e.target.value,
                valueSource: "linked" as const,
                sourceNodeId: (selectedValue as any).sourceNodeId || "",
                sourceNodeLabel: (selectedValue as any).nodeName || "",
              };
              onParameterUpdate(updatedParam);
            }
          }}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={param.key === null}
        >
          <option value="">이전 노드 키 선택...</option>
          {availableValues.map((val, index) => (
            <option key={`${val.key}-${index}`} value={val.key}>
              {val.key} {(val as any).nodeName && `(${(val as any).nodeName})`}
            </option>
          ))}
        </select>
      )}

      {valueMode === "reference" && availableReferences.length > 0 && (
        <div className="space-y-2">
          <select
            value={param.referenceNodeId && param.referencePath ? `${param.referenceNodeId}:${param.referencePath}` : ''}
            onChange={(e) => handleReferenceSelect(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={param.key === null}
          >
            <option value="">노드 결과 참조 선택...</option>
            {availableReferences.map((ref) => (
              <option key={`${ref.nodeId}:${ref.field}`} value={`${ref.nodeId}:${ref.field}`}>
                {ref.displayPath}
              </option>
            ))}
          </select>
          
          {param.displayReference && (
            <div className="p-2 bg-blue-50 rounded border text-xs">
              <div className="font-medium text-blue-800">현재 참조:</div>
              <div className="text-blue-600">{param.displayReference}</div>
            </div>
          )}
        </div>
      )}

      {/* 참조 불가능한 상태 메시지 */}
      {valueMode === "linked" && availableValues.length === 0 && (
        <div className="p-2 bg-gray-50 rounded border text-xs text-gray-600">
          사용 가능한 이전 노드 키가 없습니다.
        </div>
      )}

      {valueMode === "reference" && availableReferences.length === 0 && (
        <div className="p-2 bg-gray-50 rounded border text-xs text-gray-600">
          참조 가능한 노드 결과가 없습니다. 먼저 이전 노드를 실행하세요.
        </div>
      )}
    </div>
  );
};

export default ParameterForm;