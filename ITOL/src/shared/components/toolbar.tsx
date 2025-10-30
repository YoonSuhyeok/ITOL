import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import SettingsModal from "./settings-modal";
import type { ApiNodeData } from "@/entities/language/model/api-node-type";

interface ToolbarProps {
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string;
  onCreateApiNode: (apiData: ApiNodeData) => string;
}

const Toolbar = ({ onCreateFileNode, onCreateApiNode }: ToolbarProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-200 flex items-center justify-center px-4 z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSettingsClick}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            설정
          </Button>
        </div>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={handleCloseSettings}
        onCreateFileNode={onCreateFileNode}
        onCreateApiNode={onCreateApiNode}
      />
    </>
  );
};

export default Toolbar;
