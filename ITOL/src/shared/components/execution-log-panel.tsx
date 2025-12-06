import React, { useEffect, useRef, useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Search } from 'lucide-react';
import { useLogStore, type LogEntry } from '@/shared/store/use-log-store';
import { Button } from './ui/button';

export const ExecutionLogPanel: React.FC = () => {
  const { logs, isOpen, height, clearLogs, setIsOpen, setHeight } = useLogStore();
  const [filter, setFilter] = useState<'all' | 'stdout' | 'stderr' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 드래그로 높이 조절
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY;
      const newHeight = startHeight + delta;
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startHeight, setHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'stdout': return 'text-gray-700';
      case 'stderr': return 'text-orange-600';
      case 'info': return 'text-blue-600';
      case 'error': return 'text-red-700 font-semibold';
      case 'success': return 'text-green-600 font-semibold';
      case 'warning': return 'text-yellow-600';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'stdout': return '▶';
      case 'stderr': return '⚠';
      case 'info': return 'ℹ';
      case 'error': return '✗';
      case 'success': return '✓';
      case 'warning': return '⚡';
    }
  };

  const filteredLogs = logs.filter(log => {
    // 타입 필터
    if (filter !== 'all' && log.type !== filter) return false;
    
    // 검색어 필터
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div 
      className="border-t bg-gray-50 flex flex-col"
      style={{ height: isOpen ? height : 40 }}
    >
      {/* 리사이즈 핸들 */}
      {isOpen && (
        <div
          className="h-1 bg-gray-200 cursor-ns-resize hover:bg-blue-400 transition-colors"
          onMouseDown={handleResizeStart}
        />
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-sm">Execution Logs</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {filteredLogs.length} / {logs.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 검색 */}
          {isOpen && (
            <>
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-2 py-1 text-xs border rounded w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 필터 */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="all">All</option>
                <option value="stdout">stdout</option>
                <option value="stderr">stderr</option>
                <option value="error">Errors</option>
              </select>

              {/* 자동 스크롤 */}
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                Auto
              </label>

              {/* Clear */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-7 px-2"
                disabled={logs.length === 0}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                <span className="text-xs">Clear</span>
              </Button>
            </>
          )}

          {/* 접기/펼치기 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 w-7 p-0"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 로그 내용 */}
      {isOpen && (
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-gray-900 text-gray-100"
          style={{ maxHeight: height - 80 }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {logs.length === 0 ? (
                <div className="text-center">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No logs yet. Execute a node to see logs here.</p>
                </div>
              ) : (
                <p>No logs match your filter criteria.</p>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="py-1 hover:bg-gray-800 px-2 rounded group"
              >
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className="text-blue-400 ml-2">{log.nodeName}</span>
                <span className={`ml-2 ${getLogColor(log.type)}`}>
                  {getLogIcon(log.type)} {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
