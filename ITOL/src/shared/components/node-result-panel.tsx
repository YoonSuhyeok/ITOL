import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, FileJson, Clock, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNodeStore } from '../store/use-node-store';

export const NodeResultPanel: React.FC = () => {
  const { nodeResults } = useNodeStore();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Convert nodeResults object to array
  const resultsArray = Object.entries(nodeResults).map(([nodeId, result]) => ({
    nodeId,
    ...result
  }));

  const selectedResult = selectedNodeId ? nodeResults[selectedNodeId] : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-l-blue-500 bg-blue-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-[65px] bottom-12 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-full rounded-none rounded-l-lg border-r-0 bg-white shadow-md hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-[65px] bottom-12 w-96 bg-white border-l shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">Node Results</span>
          <Badge variant="outline" className="ml-1">
            {resultsArray.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto">
        {resultsArray.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Terminal className="h-16 w-16 mb-4" />
            <p className="text-sm">No node results yet</p>
            <p className="text-xs text-gray-500 mt-1">Run nodes to see their output</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {resultsArray.map((result) => (
              <button
                key={result.nodeId}
                onClick={() => setSelectedNodeId(result.nodeId)}
                className={`w-full text-left p-3 rounded-lg border-l-4 transition-all ${getStatusColor(
                  result.status
                )} ${
                  selectedNodeId === result.nodeId
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-sm text-gray-800">
                      {result.nodeName || result.nodeId}
                    </span>
                  </div>
                  <Badge
                    variant={
                      result.status === 'success'
                        ? 'default'
                        : result.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {result.status}
                  </Badge>
                </div>

                {result.executionTime && (
                  <div className="text-xs text-gray-600 mb-1">
                    ⏱️ {result.executionTime}ms
                  </div>
                )}

                {result.error && (
                  <div className="text-xs text-red-600 truncate mt-1">
                    ❌ {result.error}
                  </div>
                )}

                {result.data && (
                  <div className="text-xs text-gray-500 truncate mt-1">
                    📄 Output available
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail View */}
      {selectedResult && (
        <div className="border-t bg-gray-50 max-h-64 overflow-y-auto">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-gray-700">Output Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNodeId(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Status Info */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(selectedResult.status)}
                <span className="text-sm font-medium">
                  {selectedResult.status.toUpperCase()}
                </span>
                {selectedResult.executionTime && (
                  <span className="text-xs text-gray-500">
                    ({selectedResult.executionTime}ms)
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {selectedResult.error && (
              <div className="mb-3">
                <div className="text-xs font-medium text-red-700 mb-1">Error:</div>
                <div className="bg-red-100 text-red-800 text-xs p-2 rounded border border-red-200 font-mono">
                  {selectedResult.error}
                </div>
              </div>
            )}

            {/* Output Data */}
            {selectedResult.data && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Output:</div>
                <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded overflow-x-auto font-mono max-h-48 overflow-y-auto">
                  {typeof selectedResult.data === 'string'
                    ? selectedResult.data
                    : JSON.stringify(selectedResult.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Stdout */}
            {selectedResult.stdout && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Stdout:</div>
                <pre className="bg-gray-100 text-gray-800 text-xs p-2 rounded overflow-x-auto font-mono max-h-32 overflow-y-auto border">
                  {selectedResult.stdout}
                </pre>
              </div>
            )}

            {/* Stderr */}
            {selectedResult.stderr && (
              <div className="mt-3">
                <div className="text-xs font-medium text-orange-700 mb-1">Stderr:</div>
                <pre className="bg-orange-50 text-orange-800 text-xs p-2 rounded overflow-x-auto font-mono max-h-32 overflow-y-auto border border-orange-200">
                  {selectedResult.stderr}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
