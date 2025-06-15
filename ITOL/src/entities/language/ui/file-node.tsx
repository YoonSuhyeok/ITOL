
import { memo } from "react"
import { cn } from "@/shared/lib/utils";
import { Handle, Position } from "@xyflow/react";
import { Button } from "@/shared/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip";
import NodeType from "@/shared/types/node-type";
import FileNodeData from "../model/file-type";

function FileNode({id, type, data}: NodeType<FileNodeData>) {
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