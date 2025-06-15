import { Checkbox } from "@radix-ui/react-checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Input } from "./ui/input";

import Parameter from "../types/node-parameter-type";
import ReuqestBody from "../types/request-type";
import { cn } from "../lib/utils";

function getShortNodeId(nodeId: string): string {
    return nodeId.length > 6 ? nodeId.substring(0, 6) + "..." : nodeId
}

// 키 선택 처리
function handleKeySelect(paramId: string, key: string, type: string, setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>, setOpenKeyPopover: React.Dispatch<React.SetStateAction<string | null>>) {
    // 파라미터 업데이트
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

    // 팝오버 닫기
    setOpenKeyPopover(null)
}

function handleValueSourceChange(paramId: string, source: "manual" | "linked", setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>) {
    setParameters((prev) =>
      prev.map((param) =>
        param.id === paramId
          ? {
              ...param,
              valueSource: source,
              // 직접 입력 모드로 변경 시 연결 정보 초기화
              ...(source === "manual"
                ? { sourceNodeId: undefined, sourceNodeLabel: undefined, sourcePath: undefined }
                : {}),
            }
          : param,
      ),
    )
})

  // 파라미터 삭제 함수
function deleteParameter(id: string, setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>) {
    setParameters((prev) => prev.filter((param) => param.id !== id))
}

const ParameterForm = ({
    isParameterSectionCollapsed,
    parent_parameters
}: {
    isParameterSectionCollapsed: boolean;
    parent_parameters: {
        id: string;
        key: string;
        value: string;
        type?: string;
        checked: boolean;
        valueSource?: "linked" | "static";
        sourcePath?: string;
    }[];
}) => {
    
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [openKeyPopover, setOpenKeyPopover] = useState<string | null>(null);
    const [requestType, setRequestType] = useState<ReuqestBody>();

    const handleParameterChange = useCallback((id: string, field: keyof Parameter, value: any) => {
        setParameters((prev) => prev.map((param) => (param.id === id ? { ...param, [field]: value } : param)))
    }, []);

    // 키 선택 드롭다운 열기/닫기 처리
    const handleKeyPopoverOpenChange = useCallback((paramId: string, open: boolean) => {
        if (open) {
        setOpenKeyPopover(paramId)
        } else {
        setOpenKeyPopover(null)
        }
    }, [])
    
    return (
        <div>
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
                      onCheckedChange={(checked) => handleParameterChange(param.id, "checked", checked)}
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
                              {param.type && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {param.type}
                                </Badge>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search key..." />
                            <CommandList>
                              <CommandEmpty>No key found.</CommandEmpty>
                              <CommandGroup>
                                {requestType &&
                                  Object.entries(requestType.properties).map(([key, prop]) => (
                                    <CommandItem
                                      key={key}
                                      value={key}
                                      onSelect={() => handleKeySelect(param.id, key, prop.type, setParameters, setOpenKeyPopover)}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              param.key === key ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {key}
                                          {prop.description && (
                                            <span className="ml-2 text-xs text-muted-foreground">
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
                    {/* 값 입력 부분을 단일 입력 필드로 변경 */}
                    <div className="relative">
                      {param.valueSource === "linked" && param.sourcePath ? (
                        <div className="flex items-center">
                          <Input
                            value={param.value}
                            onChange={(e) => handleParameterChange(param.id, "value", e.target.value)}
                            className="w-full pr-24"
                            readOnly={param.valueSource === "linked"}
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {param.sourceNodeLabel || getShortNodeId(param.sourceNodeId || "")}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleValueSourceChange(param.id, "manual", setParameters)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex">
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => handleParameterChange(param.id, "value", e.target.value)}
                            className="w-full"
                          />
                          
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteParameter(param.id, setParameters)}
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