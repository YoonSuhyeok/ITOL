import React, { useState } from 'react';
import { X, Minus, Square } from 'lucide-react';
import styles from './window-header.module.css';

interface WindowHeaderProps {
  title?: string;
}

const WindowHeader: React.FC<WindowHeaderProps> = ({
  title = "ITOL"
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // 윈도우 제어 함수들
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      
      if (isMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error('Failed to maximize/unmaximize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div className={styles.windowHeader}>
      {/* 타이틀바 */}
      <div className={styles.titleBar} data-tauri-drag-region>
        {/* 좌측 메뉴 */}
        <div className={styles.menuSection}>
          <div className={styles.menuItems}>
            <button className={styles.menuItem}>File</button>
            <button className={styles.menuItem}>Edit</button>
            <button className={styles.menuItem}>View</button>
            <button className={styles.menuItem}>Run</button>
            <button className={styles.menuItem}>Help</button>
          </div>
        </div>

        {/* 중앙 타이틀 */}
        <div className={styles.titleSection}>
          <span className={styles.title}>{title}</span>
        </div>

        {/* 우측 윈도우 컨트롤 */}
        <div className={styles.windowControls}>
          <button 
            className={styles.windowButton}
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            <Minus size={14} />
          </button>
          <button 
            className={styles.windowButton}
            onClick={handleMaximize}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            <Square size={14} />
          </button>
          <button 
            className={`${styles.windowButton} ${styles.closeButton}`}
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 탭바 */}
      <div className={styles.tabBar} data-tauri-drag-region>
        <div className={styles.tabs}>
          <div className={`${styles.tab} ${styles.activeTab}`}>
            <span className={styles.tabLabel}>App.tsx</span>
            <button className={styles.tabCloseBtn}>
              <X size={12} />
            </button>
          </div>
          <div className={styles.tab}>
            <span className={styles.tabLabel}>main.tsx</span>
            <button className={styles.tabCloseBtn}>
              <X size={12} />
            </button>
          </div>
        </div>
        
        <div className={styles.tabActions}>
          <button className={styles.newTabBtn} aria-label="New tab">
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindowHeader;
