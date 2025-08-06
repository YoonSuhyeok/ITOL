import { Settings } from "lucide-react";
import { Button } from "./ui/button";

const Toolbar = () => {
  const handleSettingsClick = () => {
    console.log("Settings clicked");
    // 설정 모달이나 사이드바를 여는 로직을 추가할 수 있습니다
  };

  return (
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
  );
};

export default Toolbar;
