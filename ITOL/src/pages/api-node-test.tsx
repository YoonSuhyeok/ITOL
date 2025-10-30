import { ReactFlowProvider } from '@xyflow/react';
import ApiNode from '../entities/language/ui/api-node';
import { createDefaultApiNodeData } from '../entities/language/model/api-node-type';
import '@xyflow/react/dist/style.css';

/**
 * API Node 테스트 페이지
 * Playwright E2E 테스트를 위한 독립적인 페이지
 */
export default function ApiNodeTestPage() {
  const testNodeData = createDefaultApiNodeData();

  return (
    <div className="w-full h-screen p-8 bg-gray-100">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">API Node Test Page</h1>
        <p className="text-gray-600">
          이 페이지는 API Node 컴포넌트를 테스트하기 위한 페이지입니다.
        </p>
      </div>

      <ReactFlowProvider>
        <div className="flex justify-center">
          <ApiNode 
            id="test-api-node-1" 
            data={testNodeData}
          />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
