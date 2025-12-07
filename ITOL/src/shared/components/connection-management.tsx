import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  CheckCircle2, 
  XCircle,
  Save,
  X,
  FolderOpen
} from 'lucide-react';
import type { SavedConnection, DatabaseType, DatabaseConnection } from './settings-modal/types';
import { ConnectionStorageServiceInstance } from '../services/connection-storage.service';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

const DATABASE_TYPES: { value: DatabaseType; label: string }[] = [
  { value: 'sqlite', label: 'SQLite' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' },
];

export const ConnectionManagementSection: React.FC = () => {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    connection: DatabaseConnection;
  }>({
    name: '',
    description: '',
    connection: { type: 'sqlite' }
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ 
    success: boolean; 
    message: string;
    connectionId?: string;
  } | null>(null);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const loaded = await ConnectionStorageServiceInstance.getAllConnections();
      setConnections(loaded);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleStartNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      connection: { type: 'sqlite' }
    });
    setConnectionTestResult(null);
  };

  const handleEdit = (conn: SavedConnection) => {
    setIsEditing(true);
    setEditingId(conn.id);
    setFormData({
      name: conn.name,
      description: conn.description || '',
      connection: conn.connection
    });
    setConnectionTestResult(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setConnectionTestResult(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await ConnectionStorageServiceInstance.updateConnection(editingId, formData);
      } else {
        await ConnectionStorageServiceInstance.saveConnection(formData);
      }
      await loadConnections();
      handleCancel();
    } catch (error) {
      console.error('Failed to save connection:', error);
      alert('커넥션 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 커넥션을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await ConnectionStorageServiceInstance.deleteConnection(id);
      await loadConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('커넥션 삭제에 실패했습니다.');
    }
  };

  const handleTestConnection = async (connectionId?: string) => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    const connToTest = connectionId 
      ? connections.find(c => c.id === connectionId)?.connection
      : formData.connection;

    if (!connToTest) {
      setIsTestingConnection(false);
      return;
    }

    try {
      const result = await invoke<string>('test_db_connection_command', {
        params: { connection: connToTest }
      });

      setConnectionTestResult({
        success: true,
        message: result || 'Connection successful!',
        connectionId
      });
    } catch (error: any) {
      setConnectionTestResult({
        success: false,
        message: error.message || error.toString() || 'Connection failed',
        connectionId
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const updateConnection = <K extends keyof DatabaseConnection>(key: K, value: DatabaseConnection[K]) => {
    setFormData(prev => ({
      ...prev,
      connection: { ...prev.connection, [key]: value }
    }));
  };

  const handleBrowseSqliteFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'SQLite Database',
            extensions: ['db', 'sqlite', 'sqlite3', 'db3']
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ]
      });

      if (selected) {
        updateConnection('filePath', selected as string);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  };

  const filteredConnections = connections.filter(c => 
    searchTerm === '' ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDatabaseColor = (type: DatabaseType) => {
    switch (type) {
      case 'sqlite': return 'bg-green-100 text-green-800';
      case 'postgresql': return 'bg-blue-100 text-blue-800';
      case 'oracle': return 'bg-red-100 text-red-800';
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingId ? '커넥션 편집' : '새 커넥션 추가'}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </div>
        </div>

        <div className="space-y-4 border rounded-lg p-6">
          <div>
            <Label>커넥션 이름 *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Database Connection"
            />
          </div>

          <div>
            <Label>설명 (선택)</Label>
            <Textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="커넥션에 대한 설명..."
            />
          </div>

          <div>
            <Label>데이터베이스 타입</Label>
            <Select
              value={formData.connection.type}
              onValueChange={(value: DatabaseType) => {
                setFormData(prev => ({
                  ...prev,
                  connection: { type: value }
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATABASE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SQLite Configuration */}
          {formData.connection.type === 'sqlite' && (
            <div>
              <Label>Database File Path</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.connection.filePath || ''}
                  onChange={(e) => updateConnection('filePath', e.target.value)}
                  placeholder="/path/to/database.db"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseSqliteFile}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
            </div>
          )}

          {/* PostgreSQL Configuration */}
          {formData.connection.type === 'postgresql' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Host</Label>
                  <Input
                    value={formData.connection.host || ''}
                    onChange={(e) => updateConnection('host', e.target.value)}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={formData.connection.port || ''}
                    onChange={(e) => updateConnection('port', parseInt(e.target.value))}
                    placeholder="5432"
                  />
                </div>
              </div>

              <div>
                <Label>Database Name</Label>
                <Input
                  value={formData.connection.database || ''}
                  onChange={(e) => updateConnection('database', e.target.value)}
                  placeholder="database_name"
                />
              </div>

              <div>
                <Label>Schema (Optional)</Label>
                <Input
                  value={formData.connection.schema || ''}
                  onChange={(e) => updateConnection('schema', e.target.value)}
                  placeholder="public"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    value={formData.connection.username || ''}
                    onChange={(e) => updateConnection('username', e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.connection.password || ''}
                    onChange={(e) => updateConnection('password', e.target.value)}
                    placeholder="password"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.connection.sslMode || false}
                  onCheckedChange={(checked) => updateConnection('sslMode', checked)}
                />
                <Label>Enable SSL</Label>
              </div>
            </>
          )}

          {/* Oracle Configuration */}
          {formData.connection.type === 'oracle' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Host</Label>
                  <Input
                    value={formData.connection.host || ''}
                    onChange={(e) => updateConnection('host', e.target.value)}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={formData.connection.port || ''}
                    onChange={(e) => updateConnection('port', parseInt(e.target.value))}
                    placeholder="1521"
                  />
                </div>
              </div>

              <div>
                <Label>Service Name</Label>
                <Input
                  value={formData.connection.serviceName || ''}
                  onChange={(e) => updateConnection('serviceName', e.target.value)}
                  placeholder="ORCL"
                />
              </div>

              <div>
                <Label>SID (Alternative to Service Name)</Label>
                <Input
                  value={formData.connection.sid || ''}
                  onChange={(e) => updateConnection('sid', e.target.value)}
                  placeholder="ORCL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    value={formData.connection.username || ''}
                    onChange={(e) => updateConnection('username', e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.connection.password || ''}
                    onChange={(e) => updateConnection('password', e.target.value)}
                    placeholder="password"
                  />
                </div>
              </div>
            </>
          )}

          {/* Test Connection */}
          <div className="space-y-2">
            <Button
              onClick={() => handleTestConnection()}
              disabled={isTestingConnection}
              className="w-full"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>

            {connectionTestResult && !connectionTestResult.connectionId && (
              <div className={`flex items-center gap-2 p-3 rounded ${
                connectionTestResult.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionTestResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="text-sm">{connectionTestResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">데이터베이스 커넥션 관리</h3>
          <p className="text-sm text-gray-600">저장된 데이터베이스 커넥션을 관리하고 테스트하세요</p>
        </div>
        <Button onClick={handleStartNew}>
          <Plus className="h-4 w-4 mr-2" />
          새 커넥션 추가
        </Button>
      </div>

      <div>
        <Input
          placeholder="커넥션 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredConnections.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>저장된 커넥션이 없습니다</p>
            <p className="text-sm">새 커넥션을 추가해보세요</p>
          </div>
        ) : (
          filteredConnections.map((conn) => (
            <div
              key={conn.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{conn.name}</h4>
                    <Badge className={getDatabaseColor(conn.connection.type)}>
                      {DATABASE_TYPES.find(t => t.value === conn.connection.type)?.label}
                    </Badge>
                  </div>
                  {conn.description && (
                    <p className="text-sm text-gray-600 mb-2">{conn.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    생성: {new Date(conn.createdAt).toLocaleString()}
                    {conn.updatedAt && ` • 수정: ${new Date(conn.updatedAt).toLocaleString()}`}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(conn.id)}
                    disabled={isTestingConnection}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(conn)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(conn.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {connectionTestResult?.connectionId === conn.id && (
                <div className={`flex items-center gap-2 p-3 rounded mt-3 ${
                  connectionTestResult.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionTestResult.success ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm">{connectionTestResult.message}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
