import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Plus, Trash2, Eye, EyeOff, Wand2 } from 'lucide-react';
import type { 
  ApiNodeData, 
  HttpMethod, 
  AuthType, 
  BodyType, 
  KeyValuePair
} from './settings-modal/types';

interface ApiNodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ApiNodeData;
  onSave: (data: ApiNodeData) => void;
  mode: 'create' | 'edit';
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2.0' },
];

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'raw', label: 'Raw' },
  { value: 'binary', label: 'Binary' },
];

const defaultApiNodeData: ApiNodeData = {
  type: 'api',
  name: 'New API Request',
  description: '',
  method: 'GET',
  url: '',
  queryParams: [],
  headers: [],
  auth: { type: 'none' },
  body: { type: 'none' },
  preRequestScript: '',
  testScript: '',
  timeout: 30000,
  followRedirects: true,
};

export const ApiNodeEditor: React.FC<ApiNodeEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode,
}) => {
  const [data, setData] = useState<ApiNodeData>(initialData || defaultApiNodeData);
  const [showPassword, setShowPassword] = useState(false);

  const updateData = <K extends keyof ApiNodeData>(key: K, value: ApiNodeData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  // JSON Beautify function
  const beautifyJson = () => {
    if (data.body.type !== 'json' || !data.body.raw) return;
    
    try {
      const parsed = JSON.parse(data.body.raw);
      const beautified = JSON.stringify(parsed, null, 2);
      updateData('body', { ...data.body, raw: beautified });
    } catch (error) {
      // Invalid JSON - show error or do nothing
      console.error('Invalid JSON:', error);
    }
  };

  // Key-Value pair management
  const addKeyValuePair = (type: 'queryParams' | 'headers') => {
    const newPair: KeyValuePair = { key: '', value: '', enabled: true };
    updateData(type, [...data[type], newPair]);
  };

  const updateKeyValuePair = (
    type: 'queryParams' | 'headers',
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    const updated = [...data[type]];
    updated[index] = { ...updated[index], [field]: value };
    updateData(type, updated);
  };

  const removeKeyValuePair = (type: 'queryParams' | 'headers', index: number) => {
    updateData(type, data[type].filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const getMethodColor = (method: HttpMethod) => {
    const colors: Record<HttpMethod, string> = {
      GET: 'bg-green-500',
      POST: 'bg-yellow-500',
      PUT: 'bg-blue-500',
      PATCH: 'bg-purple-500',
      DELETE: 'bg-red-500',
      HEAD: 'bg-gray-500',
      OPTIONS: 'bg-cyan-500',
    };
    return colors[method];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create API Node' : 'Edit API Node'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label>Request Name</Label>
              <Input
                value={data.name}
                onChange={(e) => updateData('name', e.target.value)}
                placeholder="My API Request"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="What does this API do?"
              />
            </div>
          </div>

          {/* Request URL */}
          <div className="flex gap-2">
            <Select value={data.method} onValueChange={(v) => updateData('method', v as HttpMethod)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    <Badge className={`${getMethodColor(method)} text-white`}>
                      {method}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1"
              value={data.url}
              onChange={(e) => updateData('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>

          {/* Tabs for detailed configuration */}
          <Tabs defaultValue="params" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="params">Params</TabsTrigger>
              <TabsTrigger value="auth">Authorization</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Query Parameters Tab */}
            <TabsContent value="params" className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Query Parameters</Label>
                <Button size="sm" variant="outline" onClick={() => addKeyValuePair('queryParams')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {data.queryParams.map((param, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Switch
                      checked={param.enabled}
                      onCheckedChange={(checked) => updateKeyValuePair('queryParams', index, 'enabled', checked)}
                    />
                    <Input
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => updateKeyValuePair('queryParams', index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => updateKeyValuePair('queryParams', index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Description"
                      value={param.description || ''}
                      onChange={(e) => updateKeyValuePair('queryParams', index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeKeyValuePair('queryParams', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {data.queryParams.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No query parameters added yet
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Authorization Tab */}
            <TabsContent value="auth" className="space-y-4">
              <div>
                <Label>Auth Type</Label>
                <Select
                  value={data.auth.type}
                  onValueChange={(v) => updateData('auth', { ...data.auth, type: v as AuthType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map((auth) => (
                      <SelectItem key={auth.value} value={auth.value}>
                        {auth.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.auth.type === 'bearer' && (
                <div>
                  <Label>Token</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={data.auth.token || ''}
                    onChange={(e) => updateData('auth', { ...data.auth, token: e.target.value })}
                    placeholder="Enter bearer token"
                  />
                </div>
              )}

              {data.auth.type === 'basic' && (
                <>
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={data.auth.username || ''}
                      onChange={(e) => updateData('auth', { ...data.auth, username: e.target.value })}
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={data.auth.password || ''}
                        onChange={(e) => updateData('auth', { ...data.auth, password: e.target.value })}
                        placeholder="Password"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {data.auth.type === 'api-key' && (
                <>
                  <div>
                    <Label>Header Name</Label>
                    <Input
                      value={data.auth.apiKeyHeader || ''}
                      onChange={(e) => updateData('auth', { ...data.auth, apiKeyHeader: e.target.value })}
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={data.auth.apiKey || ''}
                      onChange={(e) => updateData('auth', { ...data.auth, apiKey: e.target.value })}
                      placeholder="Enter API key"
                    />
                  </div>
                </>
              )}

              {data.auth.type === 'oauth2' && (
                <>
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={data.auth.oauth2?.accessToken || ''}
                      onChange={(e) =>
                        updateData('auth', {
                          ...data.auth,
                          oauth2: { ...data.auth.oauth2, accessToken: e.target.value },
                        })
                      }
                      placeholder="Enter access token"
                    />
                  </div>
                  <div>
                    <Label>Token Type</Label>
                    <Input
                      value={data.auth.oauth2?.tokenType || 'Bearer'}
                      onChange={(e) =>
                        updateData('auth', {
                          ...data.auth,
                          oauth2: { ...data.auth.oauth2, tokenType: e.target.value },
                        })
                      }
                      placeholder="Bearer"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Headers Tab */}
            <TabsContent value="headers" className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Headers</Label>
                <Button size="sm" variant="outline" onClick={() => addKeyValuePair('headers')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {data.headers.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Switch
                      checked={header.enabled}
                      onCheckedChange={(checked) => updateKeyValuePair('headers', index, 'enabled', checked)}
                    />
                    <Input
                      placeholder="Header Name"
                      value={header.key}
                      onChange={(e) => updateKeyValuePair('headers', index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateKeyValuePair('headers', index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Description"
                      value={header.description || ''}
                      onChange={(e) => updateKeyValuePair('headers', index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeKeyValuePair('headers', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {data.headers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No headers added yet
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Body Tab */}
            <TabsContent value="body" className="space-y-4">
              <div>
                <Label>Body Type</Label>
                <Select
                  value={data.body.type}
                  onValueChange={(v) => updateData('body', { ...data.body, type: v as BodyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.body.type === 'json' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>JSON Body</Label>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={beautifyJson}
                      className="h-7"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Beautify
                    </Button>
                  </div>
                  <Textarea
                    rows={10}
                    value={data.body.raw || ''}
                    onChange={(e) => updateData('body', { ...data.body, raw: e.target.value })}
                    placeholder='{\n  "key": "value"\n}'
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {data.body.type === 'raw' && (
                <div>
                  <Label>Raw Body</Label>
                  <Textarea
                    rows={10}
                    value={data.body.raw || ''}
                    onChange={(e) => updateData('body', { ...data.body, raw: e.target.value })}
                    placeholder="Enter raw request body"
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {data.body.type === 'form-data' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Form Data</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const formData = data.body.formData || [];
                        updateData('body', {
                          ...data.body,
                          formData: [...formData, { key: '', value: '', enabled: true, type: 'text' }],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {(data.body.formData || []).map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Switch checked={item.enabled} />
                      <Select value={item.type}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="file">File</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Key" value={item.key} className="flex-1" />
                      <Input placeholder="Value" value={item.value} className="flex-1" />
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {data.body.type === 'x-www-form-urlencoded' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>URL Encoded</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const urlEncoded = data.body.urlEncoded || [];
                        updateData('body', {
                          ...data.body,
                          urlEncoded: [...urlEncoded, { key: '', value: '', enabled: true }],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {(data.body.urlEncoded || []).map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Switch checked={item.enabled} />
                      <Input placeholder="Key" value={item.key} className="flex-1" />
                      <Input placeholder="Value" value={item.value} className="flex-1" />
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Scripts Tab */}
            <TabsContent value="scripts" className="space-y-4">
              <div>
                <Label>Pre-request Script</Label>
                <p className="text-xs text-gray-500 mb-2">
                  JavaScript code to run before the request is sent
                </p>
                <Textarea
                  rows={8}
                  value={data.preRequestScript || ''}
                  onChange={(e) => updateData('preRequestScript', e.target.value)}
                  placeholder="// Example: Set dynamic variables
// pm.variables.set('timestamp', Date.now());"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Test Script</Label>
                <p className="text-xs text-gray-500 mb-2">
                  JavaScript code to run after receiving the response
                </p>
                <Textarea
                  rows={8}
                  value={data.testScript || ''}
                  onChange={(e) => updateData('testScript', e.target.value)}
                  placeholder="// Example: Test response
// pm.test('Status code is 200', () => {
//   pm.response.to.have.status(200);
// });"
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label>Request Timeout (ms)</Label>
                <Input
                  type="number"
                  value={data.timeout || 30000}
                  onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                  placeholder="30000"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Follow Redirects</Label>
                  <p className="text-xs text-gray-500">Automatically follow HTTP redirects</p>
                </div>
                <Switch
                  checked={data.followRedirects ?? true}
                  onCheckedChange={(checked) => updateData('followRedirects', checked)}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
