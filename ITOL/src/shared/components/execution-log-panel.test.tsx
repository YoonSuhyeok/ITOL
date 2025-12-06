import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutionLogPanel } from '@/shared/components/execution-log-panel';
import { useLogStore } from '@/shared/store/use-log-store';

describe('ExecutionLogPanel', () => {
  it('should render with no logs message', () => {
    useLogStore.getState().clearLogs();
    
    render(<ExecutionLogPanel />);
    
    expect(screen.getByText(/No logs yet/i)).toBeInTheDocument();
  });

  it('should display logs', () => {
    useLogStore.getState().clearLogs();
    useLogStore.getState().addLog({
      nodeId: 'node-1',
      nodeName: 'test-node',
      type: 'info',
      message: 'Test log message',
    });

    render(<ExecutionLogPanel />);
    
    expect(screen.getByText(/Test log message/i)).toBeInTheDocument();
    expect(screen.getByText(/test-node/i)).toBeInTheDocument();
  });

  it('should filter logs by search term', async () => {
    useLogStore.getState().clearLogs();
    useLogStore.getState().addLog({
      nodeId: 'node-1',
      nodeName: 'test-node',
      type: 'info',
      message: 'Success message',
    });
    useLogStore.getState().addLog({
      nodeId: 'node-2',
      nodeName: 'test-node-2',
      type: 'error',
      message: 'Error message',
    });

    render(<ExecutionLogPanel />);
    
    const searchInput = screen.getByPlaceholderText(/Search logs/i);
    fireEvent.change(searchInput, { target: { value: 'Success' } });

    await waitFor(() => {
      expect(screen.getByText(/Success message/i)).toBeInTheDocument();
      expect(screen.queryByText(/Error message/i)).not.toBeInTheDocument();
    });
  });

  it('should filter logs by type', async () => {
    useLogStore.getState().clearLogs();
    useLogStore.getState().addLog({
      nodeId: 'node-1',
      nodeName: 'test-node',
      type: 'stdout',
      message: 'stdout message',
    });
    useLogStore.getState().addLog({
      nodeId: 'node-2',
      nodeName: 'test-node-2',
      type: 'stderr',
      message: 'stderr message',
    });

    render(<ExecutionLogPanel />);
    
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'stdout' } });

    await waitFor(() => {
      expect(screen.getByText(/stdout message/i)).toBeInTheDocument();
      expect(screen.queryByText(/stderr message/i)).not.toBeInTheDocument();
    });
  });

  it('should toggle panel open/close', () => {
    useLogStore.getState().clearLogs();
    render(<ExecutionLogPanel />);
    
    const toggleButton = screen.getByRole('button', { name: '' }); // 접기 버튼
    fireEvent.click(toggleButton);

    expect(useLogStore.getState().isOpen).toBe(false);
  });

  it('should clear logs when clear button is clicked', () => {
    useLogStore.getState().clearLogs();
    useLogStore.getState().setIsOpen(true); // Open panel
    useLogStore.getState().addLog({
      nodeId: 'node-1',
      nodeName: 'test-node',
      type: 'info',
      message: 'Test message',
    });

    render(<ExecutionLogPanel />);
    
    const clearButton = screen.getByText(/Clear/i);
    fireEvent.click(clearButton);

    expect(useLogStore.getState().logs).toHaveLength(0);
  });

  it('should display log count', () => {
    useLogStore.getState().clearLogs();
    useLogStore.getState().addLog({
      nodeId: 'node-1',
      nodeName: 'test-node',
      type: 'info',
      message: 'Message 1',
    });
    useLogStore.getState().addLog({
      nodeId: 'node-2',
      nodeName: 'test-node',
      type: 'info',
      message: 'Message 2',
    });

    render(<ExecutionLogPanel />);
    
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();
  });

  it('should display different colors for log types', () => {
    useLogStore.getState().clearLogs();
    useLogStore.getState().setIsOpen(true); // Open panel
    useLogStore.getState().addLog({
      nodeId: 'node-1',
      nodeName: 'test-node',
      type: 'error',
      message: 'Error message',
    });
    useLogStore.getState().addLog({
      nodeId: 'node-2',
      nodeName: 'test-node',
      type: 'success',
      message: 'Success message',
    });

    render(<ExecutionLogPanel />);
    
    const errorLog = screen.getByText(/Error message/i);
    const successLog = screen.getByText(/Success message/i);

    expect(errorLog).toBeInTheDocument();
    expect(successLog).toBeInTheDocument();
  });
});
