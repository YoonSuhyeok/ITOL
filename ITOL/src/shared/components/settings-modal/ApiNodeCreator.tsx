import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Trash2, Plus, Send, Eye, Copy } from 'lucide-react';
import { 
  ApiNodeData, 
  ApiHeader, 
  ApiQueryParam, 
  ApiPathParam, 
  ApiRequestBody,
  ApiAuth,
  ApiFormDataItem,
  ApiUrlencodedItem 
} from './types';

interface ApiNodeCreatorProps {
  onCreateNode: (apiData: ApiNodeData) => void;
  onCancel: () => void;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const AUTH_TYPES = ['none', 'bearer', 'basic', 'api-key', 'oauth2'];
const BODY_TYPES = ['none', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary'];
const RAW_LANGUAGES = ['json', 'xml', 'html', 'text', 'javascript'];

export const ApiNodeCreator: React.FC<ApiNodeCreatorProps> = ({ onCreateNode, onCancel }) => {
  const [apiData, setApiData] = useState<ApiNodeData>({
    type: 'rest',
    method: 'GET',
    url: '',
    description: '',
    headers: [],
    queryParams: [],
    pathParams: [],
    body: { type: 'none' },
    auth: { type: 'none' },
    timeout: 5000,
    followRedirects: true,
  });

  const [activeTab, setActiveTab] = useState('params');

  // Helper functions
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addHeader = () => {
    const newHeader: ApiHeader = {
      id: generateId(),
      key: '',
      value: '',
      enabled: true,
    };
    setApiData(prev => ({
      ...prev,
      headers: [...(prev.headers || []), newHeader]
    }));
  };

  const updateHeader = (id: string, field: keyof ApiHeader, value: any) => {
    setApiData(prev => ({
      ...prev,
      headers: prev.headers?.map(header => 
        header.id === id ? { ...header, [field]: value } : header
      ) || []
    }));
  };

  const removeHeader = (id: string) => {
    setApiData(prev => ({
      ...prev,
      headers: prev.headers?.filter(header => header.id !== id) || []
    }));
  };

  const addQueryParam = () => {
    const newParam: ApiQueryParam = {
      id: generateId(),
      key: '',
      value: '',
      enabled: true,
    };
    setApiData(prev => ({
      ...prev,
      queryParams: [...(prev.queryParams || []), newParam]
    }));
  };

  const updateQueryParam = (id: string, field: keyof ApiQueryParam, value: any) => {
    setApiData(prev => ({
      ...prev,
      queryParams: prev.queryParams?.map(param => 
        param.id === id ? { ...param, [field]: value } : param
      ) || []
    }));
  };

  const removeQueryParam = (id: string) => {
    setApiData(prev => ({
      ...prev,
      queryParams: prev.queryParams?.filter(param => param.id !== id) || []
    }));
  };

  const addFormDataItem = () => {
    const newItem: ApiFormDataItem = {
      id: generateId(),
      key: '',
      value: '',
      type: 'text',
      enabled: true,
    };
    setApiData(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: [...(prev.body?.formData || []), newItem]
      } as ApiRequestBody
    }));
  };

  const updateFormDataItem = (id: string, field: keyof ApiFormDataItem, value: any) => {
    setApiData(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body?.formData?.map(item => 
          item.id === id ? { ...item, [field]: value } : item
        ) || []
      } as ApiRequestBody
    }));
  };

  const removeFormDataItem = (id: string) => {
    setApiData(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body?.formData?.filter(item => item.id !== id) || []
      } as ApiRequestBody
    }));
  };

  const handleCreate = () => {
    if (!apiData.url.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }
    onCreateNode(apiData);
  };

  const isFormValid = apiData.url.trim().length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">API Node 생성</h2>
          <p className="text-sm text-gray-600">PostMan 스타일의 API 요청 노드를 생성합니다.</p>
        </div>

        {/* Method + URL */}
        <div className="flex gap-2">
          <Select value={apiData.method} onValueChange={(value) => setApiData(prev => ({ ...prev, method: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map(method => (
                <SelectItem key={method} value={method}>
                  <Badge variant={method === 'GET' ? 'default' : method === 'POST' ? 'destructive' : 'secondary'}>
                    {method}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input 
            placeholder="https://api.example.com/users"
            value={apiData.url}
            onChange={(e) => setApiData(prev => ({ ...prev, url: e.target.value }))}
            className="flex-1"
          />
          
          <Button variant="default" className="px-6">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>

        {/* Description */}
        <Input 
          placeholder="API 설명 (선택사항)"
          value={apiData.description || ''}
          onChange={(e) => setApiData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="auth">Authorization</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="pre-script">Pre-request</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        {/* Query Parameters */}
        <TabsContent value="params" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Query Parameters</h3>
              <Button variant="outline" size="sm" onClick={addQueryParam}>
                <Plus className="h-4 w-4 mr-1" />
                Add Parameter
              </Button>
            </div>
            
            {apiData.queryParams && apiData.queryParams.length > 0 ? (
              <div className="space-y-2">
                {apiData.queryParams.map((param) => (
                  <div key={param.id} className="flex items-center gap-2 p-2 border rounded">
                    <Checkbox 
                      checked={param.enabled}
                      onCheckedChange={(checked) => updateQueryParam(param.id, 'enabled', checked)}
                    />
                    <Input 
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      placeholder="Description"
                      value={param.description || ''}
                      onChange={(e) => updateQueryParam(param.id, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeQueryParam(param.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>쿼리 파라미터가 없습니다.</p>
                <p className="text-sm">파라미터를 추가하여 시작하세요.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Authorization */}
        <TabsContent value="auth" className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Authorization Type</label>
              <Select value={apiData.auth?.type || 'none'} onValueChange={(value) => 
                setApiData(prev => ({ ...prev, auth: { type: value as any } }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {apiData.auth?.type === 'bearer' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Token</label>
                <Input 
                  placeholder="Enter your bearer token"
                  value={apiData.auth.bearer?.token || ''}
                  onChange={(e) => setApiData(prev => ({
                    ...prev,
                    auth: { ...prev.auth, bearer: { token: e.target.value } } as ApiAuth
                  }))}
                />
              </div>
            )}

            {apiData.auth?.type === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Username</label>
                  <Input 
                    placeholder="Username"
                    value={apiData.auth.basic?.username || ''}
                    onChange={(e) => setApiData(prev => ({
                      ...prev,
                      auth: { 
                        ...prev.auth, 
                        basic: { ...prev.auth?.basic, username: e.target.value, password: prev.auth?.basic?.password || '' }
                      } as ApiAuth
                    }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <Input 
                    type="password"
                    placeholder="Password"
                    value={apiData.auth.basic?.password || ''}
                    onChange={(e) => setApiData(prev => ({
                      ...prev,
                      auth: { 
                        ...prev.auth, 
                        basic: { ...prev.auth?.basic, password: e.target.value, username: prev.auth?.basic?.username || '' }
                      } as ApiAuth
                    }))}
                  />
                </div>
              </div>
            )}

            {apiData.auth?.type === 'api-key' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Key</label>
                    <Input 
                      placeholder="API Key name"
                      value={apiData.auth.apiKey?.key || ''}
                      onChange={(e) => setApiData(prev => ({
                        ...prev,
                        auth: { 
                          ...prev.auth, 
                          apiKey: { ...prev.auth?.apiKey, key: e.target.value, value: prev.auth?.apiKey?.value || '', addTo: prev.auth?.apiKey?.addTo || 'header' }
                        } as ApiAuth
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Value</label>
                    <Input 
                      placeholder="API Key value"
                      value={apiData.auth.apiKey?.value || ''}
                      onChange={(e) => setApiData(prev => ({
                        ...prev,
                        auth: { 
                          ...prev.auth, 
                          apiKey: { ...prev.auth?.apiKey, value: e.target.value, key: prev.auth?.apiKey?.key || '', addTo: prev.auth?.apiKey?.addTo || 'header' }
                        } as ApiAuth
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Add to</label>
                  <Select value={apiData.auth.apiKey?.addTo || 'header'} onValueChange={(value) =>
                    setApiData(prev => ({
                      ...prev,
                      auth: { 
                        ...prev.auth, 
                        apiKey: { ...prev.auth?.apiKey, addTo: value as 'header' | 'query', key: prev.auth?.apiKey?.key || '', value: prev.auth?.apiKey?.value || '' }
                      } as ApiAuth
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="query">Query Params</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Headers */}
        <TabsContent value="headers" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Headers</h3>
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-1" />
                Add Header
              </Button>
            </div>
            
            {apiData.headers && apiData.headers.length > 0 ? (
              <div className="space-y-2">
                {apiData.headers.map((header) => (
                  <div key={header.id} className="flex items-center gap-2 p-2 border rounded">
                    <Checkbox 
                      checked={header.enabled}
                      onCheckedChange={(checked) => updateHeader(header.id, 'enabled', checked)}
                    />
                    <Input 
                      placeholder="Header"
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      placeholder="Description"
                      value={header.description || ''}
                      onChange={(e) => updateHeader(header.id, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeHeader(header.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>헤더가 없습니다.</p>
                <p className="text-sm">헤더를 추가하여 시작하세요.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Body */}
        <TabsContent value="body" className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Body Type</label>
              <Select value={apiData.body?.type || 'none'} onValueChange={(value) => 
                setApiData(prev => ({ ...prev, body: { type: value as any } }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">none</SelectItem>
                  <SelectItem value="form-data">form-data</SelectItem>
                  <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                  <SelectItem value="raw">raw</SelectItem>
                  <SelectItem value="binary">binary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {apiData.body?.type === 'raw' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Content</label>
                  <Select value={apiData.body.raw?.language || 'json'} onValueChange={(value) =>
                    setApiData(prev => ({
                      ...prev,
                      body: {
                        ...prev.body,
                        raw: { ...prev.body?.raw, language: value as any, content: prev.body?.raw?.content || '' }
                      } as ApiRequestBody
                    }))
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RAW_LANGUAGES.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea 
                  placeholder="Enter request body..."
                  value={apiData.body.raw?.content || ''}
                  onChange={(e) => setApiData(prev => ({
                    ...prev,
                    body: {
                      ...prev.body,
                      raw: { ...prev.body?.raw, content: e.target.value, language: prev.body?.raw?.language || 'json' }
                    } as ApiRequestBody
                  }))}
                  className="h-40 font-mono text-sm"
                />
              </div>
            )}

            {apiData.body?.type === 'form-data' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Form Data</h3>
                  <Button variant="outline" size="sm" onClick={addFormDataItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {apiData.body.formData && apiData.body.formData.length > 0 ? (
                  <div className="space-y-2">
                    {apiData.body.formData.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                        <Checkbox 
                          checked={item.enabled}
                          onCheckedChange={(checked) => updateFormDataItem(item.id, 'enabled', checked)}
                        />
                        <Select value={item.type} onValueChange={(value) => updateFormDataItem(item.id, 'type', value)}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="Key"
                          value={item.key}
                          onChange={(e) => updateFormDataItem(item.id, 'key', e.target.value)}
                          className="flex-1"
                        />
                        <Input 
                          placeholder={item.type === 'file' ? "Choose file..." : "Value"}
                          value={item.value}
                          onChange={(e) => updateFormDataItem(item.id, 'value', e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeFormDataItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Form data가 없습니다.</p>
                    <p className="text-sm">항목을 추가하여 시작하세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pre-request Script */}
        <TabsContent value="pre-script" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <p>Pre-request Script 기능은 추후 구현 예정입니다.</p>
          </div>
        </TabsContent>

        {/* Tests */}
        <TabsContent value="tests" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <p>Tests 기능은 추후 구현 예정입니다.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          {isFormValid ? '✅ 준비 완료' : '❌ URL을 입력해주세요'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={!isFormValid}>
            API Node 생성
          </Button>
        </div>
      </div>
    </div>
  );
};
