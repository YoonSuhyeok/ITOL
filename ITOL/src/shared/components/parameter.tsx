import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Input } from "./ui/input";

import Parameter from "../types/node-parameter-type";
import { RequestBody, RequestProperty} from "../types/request-type";
import { cn } from "../lib/utils";
import { Checkbox } from "./ui/checkbox";
import { DagServiceInstance } from "@/features/dag/services/dag.service";

// 키 선택 처리
function handleKeySelect(
  paramId: string, 
  key: string | null, 
  type: "string" | "number" | "boolean" | "object" | "array", 
  nodeName: string | undefined, 
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, 
  setOpenPopover: React.Dispatch<React.SetStateAction<string | null>>
) {
    if (!key) return;
    
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

function handleValueSourceChange(paramId: string, source: "manual" | "linked", setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>) {
    // setParameters((prev) =>
    //   prev.map((param) =>
    //     param.id === paramId
    //       ? {
    //           ...param,
    //           valueSource: source,
    //           // 직접 입력 모드로 변경 시 연결 정보 초기화
    //           ...(source === "manual"
    //             ? { sourceNodeId: undefined, sourceNodeLabel: undefined, sourcePath: undefined }
    //             : {}),
    //         }
    //       : param,
    //   ),
    // )
}
  // 파라미터 삭제 함수
function deleteParameter(id: string, parameters: Parameter[], setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, setIsParameterSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>) {
    setParameters((prev) => prev.filter((param) => param.id !== id));

    if(parameters.length === 0) {
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
        handleKeySelect(paramId, customKey.trim(), "string", undefined, setParameters, setOpenKeyPopover);
        setCustomKeyInput(prev => ({ ...prev, [paramId]: '' }));
      }
    }, []);

    // 사용자 정의 값 추가 처리
    const handleCustomValueAdd = useCallback((paramId: string, customValue: string) => {
      if (customValue.trim()) {
        const currentParam = parameters.find(p => p.id === paramId);
        if (currentParam) {
          setParameters(prev =>
            prev.map(param =>
              param.id === paramId
                ? {
                    ...param,
                    value: customValue.trim(),
                    valueSource: "dynamic" as const,
                    checked: true
                  }
                : param
            )
          );
        }
        setCustomValueInput(prev => ({ ...prev, [paramId]: '' }));
        setOpenValuePopover(null);
      }
    }, [parameters]);

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
      setParameters((prev) =>
        prev.map((param) => (param.key === key ? { ...param, [field]: value } : param))
      );
      console.log(`Parameter ${field} changed for ${key}:`, value);
    },
    []
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
      // DagService에도 저장 (만약 setNodeParameters 메서드가 있다면)
      // DagServiceInstance.setNodeParameters?.(nodeId, updatedParams);
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
                                      onSelect={() => handleKeySelect(param.id, prop.key, prop.type, prop.nodeName, setParameters, setOpenKeyPopover)}
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
                    { getAvailableValues(param.id).length === 0 ? 
                      <Input 
                        placeholder="직접 값 입력..."
                        disabled={param.key === null}
                        value={param.value || ''}
                        onChange={(e) => {
                          setParameters(prev =>
                            prev.map(p =>
                              p.id === param.id
                                ? { ...p, value: e.target.value, valueSource: "dynamic" as const }
                                : p
                            )
                          );
                        }}
                      />
                    : 
                    <Popover
                        open={openValuePopover === param.id}
                        onOpenChange={(open) => handleValuePopoverOpenChange(param.id, open)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between">
                            <div className="flex items-center">
                              {param.value || "Select value..."}
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
                                {getAvailableValues(param.id).map((prop, index) => (
                                    <CommandItem
                                      key={`value-${param.id}-${prop.key || 'no-key'}-${index}`}
                                      value={prop.key || ''}
                                      onSelect={() => handleValueSelect(param.id, prop.key, (prop as any).sourceNodeId, (prop as any).nodeName, setParameters, setOpenValuePopover)}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              param.value === prop.key ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {prop.key}
                                          {(prop as any).description && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              {(prop as any).nodeName ? `(${(prop as any).nodeName}) ` : ""}
                                              {(prop as any).description}
                                            </span>
                                          )}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {prop.type}
                                        </Badge>
                                      </div>
                                    </CommandItem>
                                ))}
                                {getAvailableValues(param.id).length === 0 && (
                                  <CommandItem disabled>
                                    <span className="text-gray-500">모든 값이 이미 선택됨</span>
                                  </CommandItem>
                                )}
                              </CommandGroup>
                              <div className="p-2 border-t">
                                <Input
                                  placeholder="사용자 정의 값 입력..."
                                  value={customValueInput[param.id] || ''}
                                  onChange={(e) => setCustomValueInput(prev => ({ ...prev, [param.id]: e.target.value }))}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCustomValueAdd(param.id, customValueInput[param.id] || '');
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="mt-1 w-full"
                                  onClick={() => handleCustomValueAdd(param.id, customValueInput[param.id] || '')}
                                  disabled={!customValueInput[param.id]?.trim()}
                                >
                                  추가
                                </Button>
                              </div>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    }
                  </div>
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteParameter(param.id, parameters, setParameters, setIsParameterSectionCollapsed)}
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

export default ParameterForm;