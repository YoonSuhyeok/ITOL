import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogStore } from '@/shared/store/use-log-store';

describe('useLogStore', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 초기화
    useLogStore.getState().clearLogs();
  });

  it('should add log entry', () => {
    const { result } = renderHook(() => useLogStore());

    act(() => {
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test-node',
        type: 'info',
        message: 'Test message',
        runId: 'run-1',
      });
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].message).toBe('Test message');
    expect(result.current.logs[0].nodeId).toBe('node-1');
  });

  it('should clear all logs', () => {
    const { result } = renderHook(() => useLogStore());

    act(() => {
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test-node',
        type: 'info',
        message: 'Test message 1',
      });
      result.current.addLog({
        nodeId: 'node-2',
        nodeName: 'test-node-2',
        type: 'error',
        message: 'Test message 2',
      });
    });

    expect(result.current.logs).toHaveLength(2);

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it('should clear logs for specific node', () => {
    const { result } = renderHook(() => useLogStore());

    act(() => {
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test-node-1',
        type: 'info',
        message: 'Message 1',
      });
      result.current.addLog({
        nodeId: 'node-2',
        nodeName: 'test-node-2',
        type: 'info',
        message: 'Message 2',
      });
    });

    expect(result.current.logs).toHaveLength(2);

    act(() => {
      result.current.clearNodeLogs('node-1');
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].nodeId).toBe('node-2');
  });

  it('should get logs for specific node', () => {
    const { result } = renderHook(() => useLogStore());

    act(() => {
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test-node-1',
        type: 'info',
        message: 'Message 1',
      });
      result.current.addLog({
        nodeId: 'node-2',
        nodeName: 'test-node-2',
        type: 'info',
        message: 'Message 2',
      });
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test-node-1',
        type: 'success',
        message: 'Message 3',
      });
    });

    const nodeLogs = result.current.getNodeLogs('node-1');
    expect(nodeLogs).toHaveLength(2);
    expect(nodeLogs[0].message).toBe('Message 1');
    expect(nodeLogs[1].message).toBe('Message 3');
  });

  it('should toggle panel open/close', () => {
    const { result } = renderHook(() => useLogStore());

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should adjust height within bounds', () => {
    const { result } = renderHook(() => useLogStore());

    // 정상 범위
    act(() => {
      result.current.setHeight(300);
    });
    expect(result.current.height).toBe(300);

    // 최소값
    act(() => {
      result.current.setHeight(50);
    });
    expect(result.current.height).toBe(100);

    // 최대값
    act(() => {
      result.current.setHeight(1000);
    });
    expect(result.current.height).toBe(600);
  });

  it('should generate unique log IDs', () => {
    const { result } = renderHook(() => useLogStore());

    act(() => {
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test',
        type: 'info',
        message: 'Test 1',
      });
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test',
        type: 'info',
        message: 'Test 2',
      });
    });

    const ids = result.current.logs.map(log => log.id);
    expect(new Set(ids).size).toBe(2); // 모든 ID가 unique
  });

  it('should add timestamp to logs', () => {
    const { result } = renderHook(() => useLogStore());

    act(() => {
      result.current.addLog({
        nodeId: 'node-1',
        nodeName: 'test',
        type: 'info',
        message: 'Test',
      });
    });

    expect(result.current.logs[0].timestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});
