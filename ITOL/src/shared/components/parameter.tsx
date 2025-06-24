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

function getShortNodeId(nodeId: string): string {
    return nodeId.length > 6 ? nodeId.substring(0, 6) + "..." : nodeId
}

// 키 선택 처리
function handleKeySelect(paramId: string, key: string, type: string, nodeName: string | undefined, setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, setOpenKeyPopover: React.Dispatch<React.SetStateAction<string | null>>) {
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
                valueSource: "linked"
              }
            : param,
        )
      )
    }

    // 팝오버 닫기
    setOpenKeyPopover(null)
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
    parent_parameters
}: {
    nodeId: string;
    isParameterSectionCollapsed: boolean;
    setIsParameterSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    parent_parameters: RequestProperty[];
}) => {
    
    const [parameters, setParameters] = useState<Parameter[]>([
      {
        	id: '1',
          enabled: false,
          key: null,
          value: null,
          checked: false,
          type: 'string',
          valueSource: "dynamic",
          sourcePath:  '',
          sourceNodeLabel: '',
          sourceNodeId: '',
      }
    ]);
    const [frontParameters, setFrontParameters] = useState<Parameter[]>([]);

    useEffect(() => {
      const frontParameters = DagServiceInstance.getFrontNodeParameters(nodeId);
      setFrontParameters(frontParameters);
    }, [nodeId]);

    console.log("PARAMETERS", parameters);

    const [openKeyPopover, setOpenKeyPopover] = useState<string | null>(null);

    const [openValuePopover, setOpenValuePopover] = useState<string | null>(null);
    const [requestType, setRequestType] = useState<RequestBody>({
      properties: parent_parameters
    });

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

  const paramTypes = ["string", "number"] as const;

  // 각 파라미터별 type 팝오버 열기 상태 (param.id 또는 null)
  const [openTypePopover, setOpenTypePopover] = useState<string | null>(null);

  // type 선택 핸들러
  const handleTypeSelect = (paramId: string, type: string) => {
    setParameters((prev) =>
      prev.map((p) =>
        p.id === paramId
          ? {
              ...p,
              type,
            }
          : p
      )
    );
    setOpenTypePopover(null);
  };

  const handleParameterChange = useCallback(
    (key: string, field: keyof Parameter, value: any) => {
      setParameters((prev) =>
        prev.map((param) => (param.key === key ? { ...param, [field]: value } : param))
      );
      console.log(`Parameter ${field} changed for ${key}:`, value);
    },
    []
  );
  const addParameter = useCallback(() => {
    setParameters((prev) => [
      ...prev,
      { id: `param${prev.length + 1}`, key: "", value: "", valueSource: "manual", checked: false, type: "" },
    ])
  }, []);


    return (
        <div>
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
                                {requestType &&
                                  Object.entries(requestType.properties).map(([key, prop]) => (
                                    <CommandItem
                                      key={key}
                                      value={key}
                                      onSelect={() => handleKeySelect(param.id, prop.key, prop.type, prop.nodeName, setParameters, setOpenKeyPopover)}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              param.key === key ? "opacity-100" : "opacity-0",
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
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                  </div>
                  <div className="p-2">
                    <Popover
                        open={openValuePopover === param.id}
                        onOpenChange={(open) => handleValuePopoverOpenChange(param.id, open)}
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
                                {frontParameters.length > 0 &&
                                  Object.entries(frontParameters).map(([key, prop]) => (
                                    <CommandItem
                                      key={key}
                                      value={key}
                                      onSelect={() => handleKeySelect(param.id, prop.key, prop.type, prop.nodeName, setParameters, setOpenKeyPopover)}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              param.key === key ? "opacity-100" : "opacity-0",
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
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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