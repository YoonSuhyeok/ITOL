import { CommandItem } from "@/components/ui/command";

import { useEffect, useState, useCallback, useRef, memo } from "react"
import {
  Check,
  ChevronDown,
  Play,
  X,
  Save,
  ChevronUp,
  ChevronRight,
  ChevronsUpDown,
  Code,
  Link,
  Hammer,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/shared/lib/utils";
import { Handle, Position } from "@xyflow/react";

function FileNode({id, type, data}: any) {
  let filename = 'Test';

  return (
    <div>
      {/* 입력 핸들 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555", width: 8, height: 8 }}
      />

      {/* 헤더 */}
      <div className="flex items-center p-2 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "text-white font-bold p-1 text-xs rounded",
              data.fileExtension === "ts" ? "bg-blue-500" : "bg-yellow-500",
            )}
          >
            {data.fileExtension === "ts" ? "TS" : "JS"}
          </div>
        </div>

        <div className="ml-4 text-sm font-medium">{filename}</div>

        <div className="ml-auto flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  // onClick={() => }
                >
                  {/* {isNodeMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />} */}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {/* <p>{isNodeMinimized ? "Expand" : "Minimize"}</p> */}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

      {/* 출력 핸들 */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555", width: 8, height: 8 }}
      />
    </div>
    </div>
    </div>
  );
}

export default memo(FileNode);