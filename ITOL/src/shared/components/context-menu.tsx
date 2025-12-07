import { FileText, Database, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onFileNode: () => void;
  onApiNode: () => void;
  onDbNode: () => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  onFileNode,
  onApiNode,
  onDbNode,
  onClose,
}: ContextMenuProps) {
  useEffect(() => {
    console.log('ContextMenu mounted at:', x, y);
    return () => console.log('ContextMenu unmounted');
  }, [x, y]);

  return createPortal(
    <>
      {/* Overlay to close menu on click */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          zIndex: 9999,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          minWidth: '160px',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => {
            onFileNode();
            onClose();
          }}
        >
          <FileText style={{ width: '16px', height: '16px' }} />
          File Node
        </button>

        <button
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => {
            onApiNode();
            onClose();
          }}
        >
          <Zap style={{ width: '16px', height: '16px' }} />
          API Node
        </button>

        <button
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => {
            onDbNode();
            onClose();
          }}
        >
          <Database style={{ width: '16px', height: '16px' }} />
          DB Node
        </button>
      </div>
    </>,
    document.body
  );
}
