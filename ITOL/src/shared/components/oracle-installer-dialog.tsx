import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { CheckCircle2, Download, AlertCircle, ExternalLink } from 'lucide-react';

interface OracleInstallStatus {
  installed: boolean;
  version: string | null;
  path: string | null;
}

interface OracleInstallerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallComplete?: () => void;
}

export const OracleInstallerDialog: React.FC<OracleInstallerDialogProps> = ({
  isOpen,
  onClose,
  onInstallComplete
}) => {
  const [status, setStatus] = useState<OracleInstallStatus | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [installComplete, setInstallComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkInstallation();
    }
  }, [isOpen]);

  const checkInstallation = async () => {
    try {
      const result = await invoke<OracleInstallStatus>('check_oracle_installed');
      setStatus(result);
    } catch (err: any) {
      console.error('Failed to check Oracle installation:', err);
      setError(err.message || 'Failed to check installation');
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    setInstallProgress(10);

    try {
      // 다운로드 시뮬레이션 (실제로는 백엔드에서 진행)
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      await invoke<string>('install_oracle_client');
      
      clearInterval(progressInterval);
      setInstallProgress(100);
      setInstallComplete(true);
      
      // 상태 다시 확인
      await checkInstallation();
      
      if (onInstallComplete) {
        onInstallComplete();
      }
    } catch (err: any) {
      console.error('Installation failed:', err);
      setError(err.message || 'Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleManualInstall = () => {
    // ORACLE_SETUP.md 페이지로 이동하거나 외부 링크 열기
    window.open('https://www.oracle.com/database/technologies/instant-client/downloads.html', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Oracle Instant Client Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 현재 상태 */}
          {status && (
            <Alert className={status.installed ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
              <AlertDescription className="flex items-center gap-2">
                {status.installed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">
                      Oracle Instant Client is installed
                      {status.version && ` (Version: ${status.version})`}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-800">
                      Oracle Instant Client is not installed
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 설명 */}
          {!status?.installed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Why do I need Oracle Instant Client?
              </h4>
              <p className="text-sm text-blue-800">
                Oracle Instant Client is required to connect to Oracle databases. 
                It's a lightweight Oracle client library (~100MB) that enables database connectivity.
              </p>
            </div>
          )}

          {/* 자동 설치 */}
          {!status?.installed && !installComplete && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Option 1: Automatic Installation (Recommended)
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  ITOL will automatically download and install Oracle Instant Client 21.13 
                  to your application data directory. No system-wide changes required.
                </p>
                
                {isInstalling && (
                  <div className="space-y-2 mb-3">
                    <Progress value={installProgress} className="w-full" />
                    <p className="text-xs text-gray-500">
                      {installProgress < 30 && 'Downloading Oracle Instant Client...'}
                      {installProgress >= 30 && installProgress < 80 && 'Extracting files...'}
                      {installProgress >= 80 && installProgress < 100 && 'Setting up environment...'}
                      {installProgress === 100 && 'Installation complete!'}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleInstall} 
                  disabled={isInstalling}
                  className="w-full"
                >
                  {isInstalling ? 'Installing...' : 'Install Oracle Instant Client'}
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Option 2: Manual Installation
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Download and install Oracle Instant Client manually from Oracle's official website.
                </p>
                <Button 
                  onClick={handleManualInstall} 
                  variant="outline"
                  className="w-full"
                >
                  Open Oracle Download Page
                </Button>
              </div>
            </div>
          )}

          {/* 설치 완료 */}
          {installComplete && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Installation successful!</strong>
                <br />
                You can now connect to Oracle databases. The application needs to be restarted for changes to take effect.
              </AlertDescription>
            </Alert>
          )}

          {/* 에러 */}
          {error && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Installation failed:</strong>
                <br />
                {error}
                <br />
                <br />
                <span className="text-sm">
                  Please try manual installation or check your internet connection.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* 라이선스 안내 */}
          <div className="text-xs text-gray-500 border-t pt-3">
            <p>
              By installing Oracle Instant Client, you agree to Oracle's{' '}
              <a 
                href="https://www.oracle.com/downloads/licenses/instant-client-lic.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Technology Network License Agreement
              </a>.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {installComplete ? 'Close' : 'Cancel'}
          </Button>
          {installComplete && (
            <Button onClick={() => window.location.reload()}>
              Restart Application
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
