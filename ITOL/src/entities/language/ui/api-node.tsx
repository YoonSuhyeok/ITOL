import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { 
  Send, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle 
} from "lucide-react";
import {
  ApiNodeData,
  HttpMethod,
  createDefaultApiNodeData,
  createNewKeyValuePair,
  KeyValuePair,
  BodyType
} from "../model/api-node-type";
import { ApiExecutionService } from "@/features/api/services/api-execution.service";

interface ApiNodeProps {
  id: string;
  data: ApiNodeData;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const HTTP_METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-orange-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500',
  HEAD: 'bg-gray-500',
  OPTIONS: 'bg-yellow-500'
};

export default function ApiNode({ id, data: initialData }: ApiNodeProps) {
  const [data, setData] = useState<ApiNodeData>(initialData || createDefaultApiNodeData());
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'headers' | 'params' | 'body' | 'auth'>('params');

  // Update data helper
  const updateData = (updates: Partial<ApiNodeData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // URL 변경 핸들러
  const handleUrlChange = (url: string) => {
    updateData({ url });
  };

  // HTTP Method 변경 핸들러
  const handleMethodChange = (method: HttpMethod) => {
    updateData({ method });
  };

  // Send 버튼 핸들러
  const handleSend = async () => {
    updateData({ isLoading: true });
    
    try {
      // 실제 API 호출
      const response = await ApiExecutionService.executeRequest(data);
      
      updateData({
        isLoading: false,
        lastExecuted: Date.now(),
        response
      });
    } catch (error) {
      updateData({
        isLoading: false,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
      });
    }
  };

  // Headers 관리
  const addHeader = () => {
    const newHeader = createNewKeyValuePair();
    updateData({ headers: [...data.headers, newHeader] });
  };

  const updateHeader = (id: string, field: keyof KeyValuePair, value: any) => {
    const headers = data.headers.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    );
    updateData({ headers });
  };

  const removeHeader = (id: string) => {
    const headers = data.headers.filter(h => h.id !== id);
    updateData({ headers });
  };

  // Query Params 관리
  const addQueryParam = () => {
    const newParam = createNewKeyValuePair();
    updateData({ queryParams: [...data.queryParams, newParam] });
  };

  const updateQueryParam = (id: string, field: keyof KeyValuePair, value: any) => {
    const queryParams = data.queryParams.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    updateData({ queryParams });
  };

  const removeQueryParam = (id: string) => {
    const queryParams = data.queryParams.filter(p => p.id !== id);
    updateData({ queryParams });
  };

  // Body Type 변경
  const handleBodyTypeChange = (bodyType: BodyType) => {
    updateData({ bodyType });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-[600px]" data-testid="api-node">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            API
          </Badge>
          <span className="font-semibold text-sm">{data.name}</span>
          {data.response && (
            data.response.error ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="toggle-expand"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Request Line */}
          <div className="flex gap-2" data-testid="request-line">
            <Select value={data.method} onValueChange={handleMethodChange}>
              <SelectTrigger className="w-32" data-testid="method-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map(method => (
                  <SelectItem key={method} value={method} data-testid={`method-${method}`}>
                    <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${HTTP_METHOD_COLORS[method]}`}>
                      {method}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="https://api.example.com/endpoint"
              value={data.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="flex-1"
              data-testid="url-input"
            />

            <Button
              onClick={handleSend}
              disabled={!data.url || data.isLoading}
              className="min-w-24"
              data-testid="send-button"
            >
              {data.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>

          {/* Tabs for Request Details */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} data-testid="request-tabs">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="params" data-testid="tab-params">
                Params {data.queryParams.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{data.queryParams.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers" data-testid="tab-headers">
                Headers {data.headers.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{data.headers.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="body" data-testid="tab-body">
                Body
              </TabsTrigger>
              <TabsTrigger value="auth" data-testid="tab-auth">
                Auth
              </TabsTrigger>
            </TabsList>

            {/* Query Params Tab */}
            <TabsContent value="params" className="space-y-2" data-testid="params-content">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Query Parameters</span>
                <Button variant="outline" size="sm" onClick={addQueryParam} data-testid="add-param">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {data.queryParams.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No query parameters yet. Click "Add" to create one.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.queryParams.map((param) => (
                    <div key={param.id} className="flex gap-2 items-center" data-testid={`param-row-${param.id}`}>
                      <Checkbox
                        checked={param.enabled}
                        onCheckedChange={(checked) => updateQueryParam(param.id, 'enabled', checked)}
                        data-testid={`param-enabled-${param.id}`}
                      />
                      <Input
                        placeholder="Key"
                        value={param.key}
                        onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                        className="flex-1"
                        data-testid={`param-key-${param.id}`}
                      />
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                        className="flex-1"
                        data-testid={`param-value-${param.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQueryParam(param.id)}
                        data-testid={`param-delete-${param.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Headers Tab */}
            <TabsContent value="headers" className="space-y-2" data-testid="headers-content">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">HTTP Headers</span>
                <Button variant="outline" size="sm" onClick={addHeader} data-testid="add-header">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {data.headers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No headers yet. Click "Add" to create one.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.headers.map((header) => (
                    <div key={header.id} className="flex gap-2 items-center" data-testid={`header-row-${header.id}`}>
                      <Checkbox
                        checked={header.enabled}
                        onCheckedChange={(checked) => updateHeader(header.id, 'enabled', checked)}
                        data-testid={`header-enabled-${header.id}`}
                      />
                      <Input
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        className="flex-1"
                        data-testid={`header-key-${header.id}`}
                      />
                      <Input
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        className="flex-1"
                        data-testid={`header-value-${header.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeader(header.id)}
                        data-testid={`header-delete-${header.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Body Tab */}
            <TabsContent value="body" className="space-y-2" data-testid="body-content">
              <Select value={data.bodyType} onValueChange={handleBodyTypeChange}>
                <SelectTrigger className="w-48" data-testid="body-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="form-data">Form Data</SelectItem>
                  <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                  <SelectItem value="raw">Raw</SelectItem>
                </SelectContent>
              </Select>

              {data.bodyType === 'json' && (
                <textarea
                  className="w-full h-32 p-2 border rounded font-mono text-sm"
                  placeholder='{"key": "value"}'
                  value={data.jsonBody || ''}
                  onChange={(e) => updateData({ jsonBody: e.target.value })}
                  data-testid="json-body-input"
                />
              )}

              {data.bodyType === 'raw' && (
                <textarea
                  className="w-full h-32 p-2 border rounded font-mono text-sm"
                  placeholder="Raw body content"
                  value={data.rawBody || ''}
                  onChange={(e) => updateData({ rawBody: e.target.value })}
                  data-testid="raw-body-input"
                />
              )}

              {data.bodyType === 'none' && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  This request does not have a body.
                </div>
              )}
            </TabsContent>

            {/* Auth Tab */}
            <TabsContent value="auth" className="space-y-2" data-testid="auth-content">
              <Select value={data.auth.type} onValueChange={(type) => updateData({ auth: { ...data.auth, type: type as any } })}>
                <SelectTrigger className="w-48" data-testid="auth-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                </SelectContent>
              </Select>

              {data.auth.type === 'bearer' && (
                <Input
                  placeholder="Token"
                  value={data.auth.token || ''}
                  onChange={(e) => updateData({ auth: { ...data.auth, token: e.target.value } })}
                  data-testid="bearer-token-input"
                />
              )}

              {data.auth.type === 'basic' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Username"
                    value={data.auth.username || ''}
                    onChange={(e) => updateData({ auth: { ...data.auth, username: e.target.value } })}
                    data-testid="basic-username-input"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={data.auth.password || ''}
                    onChange={(e) => updateData({ auth: { ...data.auth, password: e.target.value } })}
                    data-testid="basic-password-input"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Response Section */}
          {data.response && (
            <div className="border-t pt-4 space-y-2" data-testid="response-section">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Response</span>
                {data.response.status && (
                  <div className="flex gap-2 items-center">
                    <Badge 
                      variant={data.response.status < 400 ? "default" : "destructive"}
                      data-testid="response-status"
                    >
                      {data.response.status} {data.response.statusText}
                    </Badge>
                    {data.response.duration && (
                      <span className="text-xs text-gray-500" data-testid="response-duration">
                        {data.response.duration}ms
                      </span>
                    )}
                  </div>
                )}
              </div>

              {data.response.error ? (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700" data-testid="response-error">
                  {data.response.error}
                </div>
              ) : (
                <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-48 font-mono" data-testid="response-data">
                  {JSON.stringify(data.response.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
