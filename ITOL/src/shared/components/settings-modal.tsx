import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState } from "react";
import { Settings, Palette, Keyboard, Info, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuSection = 'general' | 'appearance' | 'editor' | 'shortcuts' | 'about';

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeSection, setActiveSection] = useState<MenuSection>('general');

  const menuItems = [
    { id: 'general' as MenuSection, icon: Settings, label: '일반' },
    { id: 'appearance' as MenuSection, icon: Palette, label: '외관' },
    { id: 'editor' as MenuSection, icon: Settings, label: '에디터' },
    { id: 'shortcuts' as MenuSection, icon: Keyboard, label: '키보드 단축키' },
    { id: 'about' as MenuSection, icon: Info, label: '정보' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">일반 설정</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 저장</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">백업 생성</label>
                  <Button variant="outline" size="sm">활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">알림</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">테마</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">다크 모드</label>
                  <Button variant="outline" size="sm">비활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">컬러 테마</label>
                  <Button variant="outline" size="sm">기본</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">폰트</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">폰트 크기</label>
                  <Button variant="outline" size="sm">14px</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">폰트 패밀리</label>
                  <Button variant="outline" size="sm">Pretendard</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'editor':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">편집기 옵션</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">미니맵 표시</label>
                  <Button variant="outline" size="sm">표시</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">그리드 스냅</label>
                  <Button variant="outline" size="sm">활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 정렬</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">노드 설정</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 연결</label>
                  <Button variant="outline" size="sm">활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">노드 미리보기</label>
                  <Button variant="outline" size="sm">표시</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">노드 조작</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">새 노드 추가</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">노드 삭제</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">노드 복사</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + C</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">노드 붙여넣기</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + V</kbd>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">선택 및 네비게이션</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">전체 선택</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + A</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">화면 맞춤</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + 0</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">확대</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + +</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">축소</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + -</kbd>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">애플리케이션 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">버전</span>
                  <span className="text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">빌드 날짜</span>
                  <span className="text-sm">2025-08-06</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">개발자</span>
                  <span className="text-sm">ITOL Team</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">라이선스</h3>
              <div className="text-sm text-gray-600">
                <p>MIT License</p>
                <p className="mt-2">
                  이 소프트웨어는 MIT 라이선스 하에 배포됩니다.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 h-[600px]" showCloseButton={true}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">설정</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[calc(600px-120px)]">
          {/* 왼쪽 메뉴 */}
          <div className="w-48 border-r bg-gray-50 p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                      activeSection === item.id
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {activeSection === item.id && (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 오른쪽 콘텐츠 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onClose}>
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
