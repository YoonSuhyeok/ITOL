import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Handle, Position, Node, useReactFlow } from "@xyflow/react";
import { Globe, Play, Settings, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import type { ApiNodeData, HttpMethod } from "@/shared/components/settings-modal/types";
import { useNodeStore } from "@/shared/store/use-node-store";
import { DagServiceInstance } from "@/features/dag/services/dag.service";

interface ApiNodeProps {
  data: ApiNodeData;
  id: string;
  setNodes?: React.Dispatch<React.SetStateAction<Node<any>[]>>;
  setEdges?: React.Dispatch<React.SetStateAction<any[]>>;
}

const getMethodColor = (method: HttpMethod): string => {
  const colors: Record<HttpMethod, string> = {
    GET: "bg-green-500 hover:bg-green-600",
    POST: "bg-yellow-500 hover:bg-yellow-600",
    PUT: "bg-blue-500 hover:bg-blue-600",
    PATCH: "bg-purple-500 hover:bg-purple-600",
    DELETE: "bg-red-500 hover:bg-red-600",
    HEAD: "bg-gray-500 hover:bg-gray-600",
    OPTIONS: "bg-cyan-500 hover:bg-cyan-600",
  };
  return colors[method];
};

function ApiNode(props: ApiNodeProps) {
  const { data, id, setNodes, setEdges } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { nodeResults, removeNodeResult } = useNodeStore();
  const { deleteElements } = useReactFlow();
  
  const currentResult = nodeResults[id];
  const isRunning = currentResult?.status === 'running';
  const lastResult = currentResult?.status === 'success' ? 'success' : currentResult?.status === 'error' ? 'error' : null;

  const handleRun = async () => {
    // DAG 서비스를 통해 실행하여 순차 실행 로직을 사용
    await DagServiceInstance.runNode(id);
  };

  const handleDelete = () => {
    // Remove from ReactFlow
    deleteElements({ nodes: [{ id }] });
    // Remove from DagService
    DagServiceInstance.removeNode(id);
    // Remove result from store
    removeNodeResult(id);
  };

  const getStatusIcon = () => {
    if (isRunning) return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
    if (lastResult === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (lastResult === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div
      className={cn(
        "bg-white border-2 rounded-lg shadow-lg w-[380px] relative transition-all",
        isRunning && "ring-2 ring-blue-500 ring-offset-2",
        lastResult === 'success' && "ring-2 ring-green-500",
        lastResult === 'error' && "ring-2 ring-red-500"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-t-lg border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-800 truncate">
              {data.name || 'API Request'}
            </span>
            {getStatusIcon()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Delete node"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Method and URL */}
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs font-bold text-white", getMethodColor(data.method))}>
            {data.method}
          </Badge>
          <span className="text-xs text-gray-600 truncate flex-1" title={data.url}>
            {data.url || 'No URL set'}
          </span>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Description */}
          {data.description && (
            <div className="text-xs text-gray-600 italic border-l-2 border-blue-200 pl-2">
              {data.description}
            </div>
          )}

          {/* Request Details */}
          <div className="space-y-2 text-xs">
            {/* Query Params */}
            {data.queryParams.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">Params:</span>
                <span className="text-gray-700">
                  {data.queryParams.filter(p => p.enabled).length} parameter(s)
                </span>
              </div>
            )}

            {/* Headers */}
            {data.headers.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">Headers:</span>
                <span className="text-gray-700">
                  {data.headers.filter(h => h.enabled).length} header(s)
                </span>
              </div>
            )}

            {/* Auth */}
            {data.auth.type !== 'none' && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">Auth:</span>
                <Badge variant="outline" className="text-xs">
                  {data.auth.type.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Body Type */}
            {data.body.type !== 'none' && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">Body:</span>
                <Badge variant="outline" className="text-xs">
                  {data.body.type.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Timeout */}
            {data.timeout && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">Timeout:</span>
                <span className="text-gray-700">{data.timeout}ms</span>
              </div>
            )}
          </div>

          {/* Scripts Indicators */}
          {(data.preRequestScript || data.testScript) && (
            <div className="flex gap-2 pt-2 border-t">
              {data.preRequestScript && (
                <Badge variant="secondary" className="text-xs">
                  Pre-request
                </Badge>
              )}
              {data.testScript && (
                <Badge variant="secondary" className="text-xs">
                  Tests
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              className="flex-1 h-8"
              onClick={handleRun}
              disabled={isRunning || !data.url}
            >
              <Play className="h-3 w-3 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                // Double click will trigger edit modal
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="p-2 text-center">
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-7"
            onClick={handleRun}
            disabled={isRunning || !data.url}
          >
            <Play className="h-3 w-3 mr-1" />
            {isRunning ? 'Running...' : 'Run Request'}
          </Button>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />

      {/* Running Animation */}
      {isRunning && (
        <div className="absolute inset-[-4px] rounded-lg z-[-5] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" />
        </div>
      )}
    </div>
  );
}

export default ApiNode;
