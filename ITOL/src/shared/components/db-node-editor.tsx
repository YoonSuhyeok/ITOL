import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Database, Play, Save, FolderOpen, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { 
  DbNodeData, 
  DatabaseType, 
  DatabaseConnection,
  ColumnSelection,
  SavedQuery,
  SavedConnection
} from './settings-modal/types';
import { invoke } from '@tauri-apps/api/core';
import { QueryStorageServiceInstance } from '../services/query-storage.service';
import { ConnectionStorageServiceInstance } from '../services/connection-storage.service';
import { open } from '@tauri-apps/plugin-dialog';
import { OracleInstallerDialog } from './oracle-installer-dialog';

interface DbNodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DbNodeData;
  onSave: (data: DbNodeData) => void;
  mode: 'create' | 'edit';
}

const DATABASE_TYPES: { value: DatabaseType; label: string }[] = [
  { value: 'sqlite', label: 'SQLite' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' },
];

const defaultDbNodeData: DbNodeData = {
  type: 'db',
  name: 'New Database Query',
  description: '',
  connection: {
    type: 'sqlite',
  },
  query: '',
  columnSelection: [],
  selectAllColumns: true,
  timeout: 30000,
  maxRows: 1000,
};

export const DbNodeEditor: React.FC<DbNodeEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode,
}) => {
  const [data, setData] = useState<DbNodeData>(initialData || defaultDbNodeData);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Query save/load state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Connection load state
  const [showLoadConnectionDialog, setShowLoadConnectionDialog] = useState(false);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [connectionSearchTerm, setConnectionSearchTerm] = useState('');

  // Oracle installer state
  const [showOracleInstaller, setShowOracleInstaller] = useState(false);

  // Load saved queries when load dialog opens
  useEffect(() => {
    if (showLoadDialog) {
      loadSavedQueries();
    }
  }, [showLoadDialog]);

  // Load saved connections when load connection dialog opens
  useEffect(() => {
    if (showLoadConnectionDialog) {
      loadSavedConnections();
    }
  }, [showLoadConnectionDialog]);

  const loadSavedQueries = async () => {
    try {
      const queries = await QueryStorageServiceInstance.getAllQueries();
      setSavedQueries(queries);
    } catch (error) {
      console.error('Failed to load saved queries:', error);
    }
  };

  const loadSavedConnections = async () => {
    try {
      const connections = await ConnectionStorageServiceInstance.getAllConnections();
      setSavedConnections(connections);
    } catch (error) {
      console.error('Failed to load saved connections:', error);
    }
  };

  const handleSaveQuery = async () => {
    if (!queryName.trim()) {
      alert('Please enter a query name');
      return;
    }

    try {
      await QueryStorageServiceInstance.saveQuery({
        name: queryName,
        description: queryDescription,
        query: data.query,
        databaseType: data.connection.type,
      });
      
      setShowSaveDialog(false);
      setQueryName('');
      setQueryDescription('');
      alert('Query saved successfully!');
    } catch (error) {
      console.error('Failed to save query:', error);
      alert('Failed to save query');
    }
  };

  const handleLoadQuery = (query: SavedQuery) => {
    updateData('query', query.query);
    setShowLoadDialog(false);
  };

  const handleLoadConnection = (conn: SavedConnection) => {
    updateData('connection', conn.connection);
    setShowLoadConnectionDialog(false);
  };

  const handleDeleteQuery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) {
      return;
    }

    try {
      await QueryStorageServiceInstance.deleteQuery(id);
      await loadSavedQueries();
    } catch (error) {
      console.error('Failed to delete query:', error);
      alert('Failed to delete query');
    }
  };

  const filteredQueries = savedQueries.filter(q => 
    searchTerm === '' ||
    q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const filteredConnections = savedConnections.filter(c => 
    connectionSearchTerm === '' ||
    c.name.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(connectionSearchTerm.toLowerCase())
  );

  const updateData = <K extends keyof DbNodeData>(key: K, value: DbNodeData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const updateConnection = <K extends keyof DatabaseConnection>(key: K, value: DatabaseConnection[K]) => {
    setData(prev => ({ ...prev, connection: { ...prev.connection, [key]: value } }));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const result = await invoke<string>('test_db_connection_command', {
        params: {
          connection: data.connection,
        }
      });

      setConnectionTestResult({
        success: true,
        message: result || 'Connection successful!',
      });
    } catch (error: any) {
      const errorMsg = error.message || error.toString() || 'Connection failed';
      
      setConnectionTestResult({
        success: false,
        message: errorMsg,
      });

      // Oracle 연결 실패 시 Instant Client 미설치 감지
      if (data.connection.type === 'oracle' && 
          (errorMsg.includes('DPI-1047') || 
           errorMsg.includes('Cannot locate') || 
           errorMsg.includes('not yet supported'))) {
        // 설치 다이얼로그 표시
        setTimeout(() => setShowOracleInstaller(true), 1000);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const addColumnSelection = () => {
    const newColumn: ColumnSelection = { columnName: '', enabled: true };
    updateData('columnSelection', [...data.columnSelection, newColumn]);
  };

  const updateColumnSelection = (index: number, field: keyof ColumnSelection, value: string | boolean) => {
    const updated = [...data.columnSelection];
    updated[index] = { ...updated[index], [field]: value };
    updateData('columnSelection', updated);
  };

  const removeColumnSelection = (index: number) => {
    updateData('columnSelection', data.columnSelection.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {mode === 'create' ? 'Create Database Node' : 'Edit Database Node'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label>Node Name</Label>
            <Input
              value={data.name}
              onChange={(e: any) => updateData('name', e.target.value)}
              placeholder="Enter node name"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={data.description || ''}
              onChange={(e: any) => updateData('description', e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
              <TabsTrigger value="columns">Columns</TabsTrigger>
              <TabsTrigger value="post-process">Post-Process</TabsTrigger>
            </TabsList>

            {/* Connection Tab */}
            <TabsContent value="connection" className="space-y-4">
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLoadConnectionDialog(true)}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Load Saved Connection
                </Button>
              </div>

              <div>
                <Label>Database Type</Label>
                <Select
                  value={data.connection.type}
                  onValueChange={(v: any) => updateConnection('type', v as DatabaseType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATABASE_TYPES.map((db) => (
                      <SelectItem key={db.value} value={db.value}>
                        {db.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SQLite Configuration */}
              {data.connection.type === 'sqlite' && (
                <div>
                  <Label>Database File Path</Label>
                  <div className="flex gap-2">
                    <Input
                      value={data.connection.filePath || ''}
                      onChange={(e: any) => updateConnection('filePath', e.target.value)}
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
              {data.connection.type === 'postgresql' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Host</Label>
                      <Input
                        value={data.connection.host || ''}
                        onChange={(e: any) => updateConnection('host', e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input
                        type="number"
                        value={data.connection.port || 5432}
                        onChange={(e: any) => updateConnection('port', parseInt(e.target.value))}
                        placeholder="5432"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Database Name</Label>
                    <Input
                      value={data.connection.database || ''}
                      onChange={(e: any) => updateConnection('database', e.target.value)}
                      placeholder="database_name"
                    />
                  </div>

                  <div>
                    <Label>Schema (Optional)</Label>
                    <Input
                      value={data.connection.schema || ''}
                      onChange={(e: any) => updateConnection('schema', e.target.value)}
                      placeholder="public"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={data.connection.username || ''}
                        onChange={(e: any) => updateConnection('username', e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={data.connection.password || ''}
                        onChange={(e: any) => updateConnection('password', e.target.value)}
                        placeholder="password"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={data.connection.sslMode || false}
                      onCheckedChange={(checked: any) => updateConnection('sslMode', checked)}
                    />
                    <Label>Enable SSL</Label>
                  </div>
                </>
              )}

              {/* Oracle Configuration */}
              {data.connection.type === 'oracle' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Oracle connection requires Oracle Instant Client to be installed on your system.
                      Either Service Name or SID must be provided.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Host</Label>
                      <Input
                        value={data.connection.host || ''}
                        onChange={(e: any) => updateConnection('host', e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input
                        type="number"
                        value={data.connection.port || 1521}
                        onChange={(e: any) => updateConnection('port', parseInt(e.target.value))}
                        placeholder="1521"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Service Name *</Label>
                    <Input
                      value={data.connection.serviceName || ''}
                      onChange={(e: any) => updateConnection('serviceName', e.target.value)}
                      placeholder="ORCL"
                    />
                    <p className="text-xs text-gray-500 mt-1">Preferred connection method</p>
                  </div>

                  <div>
                    <Label>SID (Alternative to Service Name)</Label>
                    <Input
                      value={data.connection.sid || ''}
                      onChange={(e: any) => updateConnection('sid', e.target.value)}
                      placeholder="SID"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use only if Service Name is not available</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={data.connection.username || ''}
                        onChange={(e: any) => updateConnection('username', e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={data.connection.password || ''}
                        onChange={(e: any) => updateConnection('password', e.target.value)}
                        placeholder="password"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Connection Test */}
              <div className="space-y-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="w-full"
                  variant="outline"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </Button>

                {connectionTestResult && (
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
            </TabsContent>

            {/* Query Tab */}
            <TabsContent value="query" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>SQL Query</Label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowLoadDialog(true)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Load Saved
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowSaveDialog(true)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Query
                    </Button>
                  </div>
                </div>
                <Textarea
                  rows={12}
                  value={data.query}
                  onChange={(e: any) => updateData('query', e.target.value)}
                  placeholder="SELECT * FROM table_name WHERE condition"
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={data.timeout || 30000}
                    onChange={(e: any) => updateData('timeout', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Max Rows</Label>
                  <Input
                    type="number"
                    value={data.maxRows || 1000}
                    onChange={(e: any) => updateData('maxRows', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Columns Tab */}
            <TabsContent value="columns" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  checked={data.selectAllColumns}
                  onCheckedChange={(checked: any) => updateData('selectAllColumns', checked)}
                />
                <Label>Select All Columns</Label>
              </div>

              {!data.selectAllColumns && (
                <>
                  <div className="flex justify-between items-center">
                    <Label>Column Selection</Label>
                    <Button size="sm" variant="outline" onClick={addColumnSelection}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Column
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {data.columnSelection.map((col, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Switch
                          checked={col.enabled}
                          onCheckedChange={(checked: any) => updateColumnSelection(index, 'enabled', checked)}
                        />
                        <Input
                          placeholder="Column Name"
                          value={col.columnName}
                          onChange={(e: any) => updateColumnSelection(index, 'columnName', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Alias (Optional)"
                          value={col.alias || ''}
                          onChange={(e: any) => updateColumnSelection(index, 'alias', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeColumnSelection(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {data.columnSelection.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No columns selected. Add columns to filter output.
                      </p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Post-Process Tab */}
            <TabsContent value="post-process" className="space-y-4">
              <div>
                <Label>Script Type</Label>
                <Select
                  value={data.postProcessScript?.type || 'javascript'}
                  onValueChange={(v: any) => 
                    updateData('postProcessScript', { 
                      ...data.postProcessScript, 
                      type: v,
                      code: data.postProcessScript?.code || '' 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Post-Processing Script</Label>
                <Textarea
                  rows={12}
                  value={data.postProcessScript?.code || ''}
                  onChange={(e: any) => 
                    updateData('postProcessScript', { 
                      type: data.postProcessScript?.type || 'javascript',
                      code: e.target.value 
                    })
                  }
                  placeholder={`// Process query results\n// Input: results (array of rows)\n// Return: processed data\n\nfunction process(results) {\n  return results.map(row => ({\n    ...row,\n    // your transformations\n  }));\n}`}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Node' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Query Name *</Label>
              <Input
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="My Query"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                rows={3}
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                placeholder="Description of what this query does..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuery}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Query Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Load Saved Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredQueries.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No saved queries found
                </div>
              ) : (
                filteredQueries.map((query) => (
                  <div
                    key={query.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{query.name}</h4>
                          <Badge variant="secondary">{query.databaseType}</Badge>
                        </div>
                        {query.description && (
                          <p className="text-sm text-gray-600 mb-2">{query.description}</p>
                        )}
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-20">
                          {query.query}
                        </pre>
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(query.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadQuery(query)}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQuery(query.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Connection Dialog */}
      <Dialog open={showLoadConnectionDialog} onOpenChange={setShowLoadConnectionDialog}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Load Saved Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search connections..."
                value={connectionSearchTerm}
                onChange={(e) => setConnectionSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredConnections.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No saved connections found
                </div>
              ) : (
                filteredConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{conn.name}</h4>
                          <Badge variant="secondary">
                            {DATABASE_TYPES.find(t => t.value === conn.connection.type)?.label}
                          </Badge>
                        </div>
                        {conn.description && (
                          <p className="text-sm text-gray-600 mb-2">{conn.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Created: {new Date(conn.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadConnection(conn)}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Oracle Installer Dialog */}
      <OracleInstallerDialog 
        isOpen={showOracleInstaller}
        onClose={() => setShowOracleInstaller(false)}
        onInstallComplete={() => {
          setShowOracleInstaller(false);
          alert('Oracle Instant Client installed! Please restart the application.');
        }}
      />
    </Dialog>
  );
};
