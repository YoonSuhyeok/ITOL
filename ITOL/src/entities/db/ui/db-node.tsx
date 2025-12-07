import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Handle, Position, Node } from "@xyflow/react";
import { Database, Play, Settings, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import type { DbNodeData, DatabaseType } from "@/shared/components/settings-modal/types";
import { useNodeStore } from "@/shared/store/use-node-store";
import { DagServiceInstance } from "@/features/dag/services/dag.service";

interface DbNodeProps {
  data: DbNodeData;
  id: string;
  setNodes?: React.Dispatch<React.SetStateAction<Node<any>[]>>;
  setEdges?: React.Dispatch<React.SetStateAction<any[]>>;
}

const getDatabaseColor = (type: DatabaseType): string => {
  const colors: Record<DatabaseType, string> = {
    sqlite: "bg-blue-500 hover:bg-blue-600",
    postgresql: "bg-indigo-500 hover:bg-indigo-600",
    oracle: "bg-red-500 hover:bg-red-600",
  };
  return colors[type];
};

const getDatabaseIcon = (type: DatabaseType): string => {
  const icons: Record<DatabaseType, string> = {
    sqlite: "SQLite",
    postgresql: "PostgreSQL",
    oracle: "Oracle",
  };
  return icons[type];
};

function DbNode(props: DbNodeProps) {
  const { data, id } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { nodeResults } = useNodeStore();
  
  const currentResult = nodeResults[id];
  const isRunning = currentResult?.status === 'running';
  const lastResult = currentResult?.status === 'success' ? 'success' : currentResult?.status === 'error' ? 'error' : null;

  const handleRun = async () => {
    // DAG 서비스를 통해 실행하여 순차 실행 로직을 사용
    await DagServiceInstance.runNode(id);
  };

  const getConnectionString = () => {
    const conn = data.connection;
    switch (conn.type) {
      case 'sqlite':
        return conn.filePath || 'No file selected';
      case 'postgresql':
        return `${conn.host}:${conn.port}/${conn.database}`;
      case 'oracle':
        return `${conn.host}:${conn.port}/${conn.serviceName}`;
      default:
        return 'Not configured';
    }
  };

  return (
    <div 
      className={cn(
        "rounded-lg border-2 bg-white shadow-lg min-w-[280px] transition-all",
        isRunning && "border-blue-400 shadow-blue-200",
        lastResult === 'success' && "border-green-400 shadow-green-200",
        lastResult === 'error' && "border-red-400 shadow-red-200",
        !isRunning && !lastResult && "border-gray-300"
      )}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-blue-500"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 flex-1">
          <Database className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-800">{data.name}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getDatabaseColor(data.connection.type))}
              >
                {getDatabaseIcon(data.connection.type)}
              </Badge>
              {isRunning && (
                <Clock className="h-3 w-3 text-blue-500 animate-spin" />
              )}
              {lastResult === 'success' && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
              {lastResult === 'error' && (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 h-6 w-6"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          {/* Connection Info */}
          <div className="text-xs space-y-1">
            <div className="text-gray-500">Connection:</div>
            <div className="font-mono text-gray-700 truncate" title={getConnectionString()}>
              {getConnectionString()}
            </div>
          </div>

          {/* Query Preview */}
          {data.query && (
            <div className="text-xs space-y-1">
              <div className="text-gray-500">Query:</div>
              <div className="font-mono text-gray-700 bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                {data.query}
              </div>
            </div>
          )}

          {/* Settings Info */}
          <div className="flex gap-2 text-xs text-gray-500">
            {data.maxRows && <span>Max: {data.maxRows} rows</span>}
            {data.timeout && <span>Timeout: {data.timeout}ms</span>}
          </div>

          {/* Post-process indicator */}
          {data.postProcessScript?.code && (
            <Badge variant="outline" className="text-xs">
              Post-process: {data.postProcessScript.type}
            </Badge>
          )}

          {/* Status Message */}
          {currentResult && (
            <div className={cn(
              "text-xs p-2 rounded",
              currentResult.status === 'success' && "bg-green-50 text-green-700",
              currentResult.status === 'error' && "bg-red-50 text-red-700",
              currentResult.status === 'running' && "bg-blue-50 text-blue-700"
            )}>
              {currentResult.status === 'running' && 'Executing query...'}
              {currentResult.status === 'success' && `Query completed successfully`}
              {currentResult.status === 'error' && currentResult.error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="p-2"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}

export default DbNode;
