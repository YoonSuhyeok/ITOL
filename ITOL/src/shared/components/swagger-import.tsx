import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileJson, 
  Link, 
  Search, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  Check,
  Save,
  Trash2,
  Database
} from 'lucide-react';
import { 
  parseSwagger, 
  convertEndpointToApiData,
  type ParsedSwagger, 
  type SwaggerEndpoint 
} from '../lib/swagger-parser';
import type { ApiNodeData, HttpMethod, SavedSwagger } from './settings-modal/types';

const SWAGGER_STORAGE_KEY = 'itol-saved-swaggers';

interface SwaggerImportProps {
  onImport: (data: Partial<ApiNodeData>) => void;
  onClose: () => void;
}

// Load saved swaggers from localStorage
const loadSavedSwaggers = (): SavedSwagger[] => {
  try {
    const stored = localStorage.getItem(SWAGGER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save swaggers to localStorage
const saveSwaggersToStorage = (swaggers: SavedSwagger[]) => {
  localStorage.setItem(SWAGGER_STORAGE_KEY, JSON.stringify(swaggers));
};

export const SwaggerImport: React.FC<SwaggerImportProps> = ({ onImport, onClose }) => {
  const [importMode, setImportMode] = useState<'saved' | 'url' | 'json'>('saved');
  const [url, setUrl] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedSwagger, setParsedSwagger] = useState<ParsedSwagger | null>(null);
  const [currentSpec, setCurrentSpec] = useState<unknown>(null); // Store raw spec for saving
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<SwaggerEndpoint | null>(null);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  
  // Saved swaggers
  const [savedSwaggers, setSavedSwaggers] = useState<SavedSwagger[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Load saved swaggers on mount
  useEffect(() => {
    const loaded = loadSavedSwaggers();
    setSavedSwaggers(loaded);
    // Auto-switch to URL tab if no saved swaggers
    if (loaded.length === 0) {
      setImportMode('url');
    }
  }, []);

  const expandAllTags = (swagger: ParsedSwagger) => {
    const allTags = new Set<string>();
    swagger.endpoints.forEach(ep => {
      ep.tags?.forEach(tag => allTags.add(tag));
      if (!ep.tags || ep.tags.length === 0) allTags.add('Untagged');
    });
    setExpandedTags(allTags);
  };

  const handleFetchSwagger = async () => {
    if (!url.trim()) {
      setError('Please enter a Swagger URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedSwagger(null);
    setSelectedEndpoint(null);

    try {
      // Fetch raw spec first
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const spec = await response.json();
      setCurrentSpec(spec);
      
      const swagger = parseSwagger(spec);
      setParsedSwagger(swagger);
      expandAllTags(swagger);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Swagger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseJson = () => {
    if (!jsonText.trim()) {
      setError('Please enter Swagger JSON');
      return;
    }

    setError(null);
    setParsedSwagger(null);
    setSelectedEndpoint(null);

    try {
      const spec = JSON.parse(jsonText);
      setCurrentSpec(spec);
      const swagger = parseSwagger(spec);
      setParsedSwagger(swagger);
      expandAllTags(swagger);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleLoadSaved = (id: string) => {
    setSelectedSavedId(id);
    const saved = savedSwaggers.find(s => s.id === id);
    if (!saved) return;

    setError(null);
    setSelectedEndpoint(null);

    try {
      setCurrentSpec(saved.spec);
      const swagger = parseSwagger(saved.spec);
      setParsedSwagger(swagger);
      expandAllTags(swagger);
      if (saved.url) setUrl(saved.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved Swagger');
    }
  };

  const handleSaveSwagger = () => {
    if (!parsedSwagger || !currentSpec || !saveName.trim()) return;

    const newSaved: SavedSwagger = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      url: url || undefined,
      spec: currentSpec,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSwaggers, newSaved];
    setSavedSwaggers(updated);
    saveSwaggersToStorage(updated);
    setSaveDialogOpen(false);
    setSaveName('');
    setSelectedSavedId(newSaved.id);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedSwaggers.filter(s => s.id !== id);
    setSavedSwaggers(updated);
    saveSwaggersToStorage(updated);
    if (selectedSavedId === id) {
      setSelectedSavedId('');
      setParsedSwagger(null);
      setCurrentSpec(null);
    }
  };

  const handleSelectEndpoint = (endpoint: SwaggerEndpoint) => {
    setSelectedEndpoint(endpoint);
  };

  const handleImport = () => {
    if (!selectedEndpoint || !parsedSwagger) return;

    const apiData = convertEndpointToApiData(
      selectedEndpoint,
      parsedSwagger.baseUrl,
      parsedSwagger.securitySchemes
    );

    onImport({
      type: 'api',
      ...apiData,
      timeout: 30000,
      followRedirects: true,
    });
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

  const toggleTag = (tag: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tag)) {
      newExpanded.delete(tag);
    } else {
      newExpanded.add(tag);
    }
    setExpandedTags(newExpanded);
  };

  // Group endpoints by tags
  const groupedEndpoints = parsedSwagger?.endpoints.reduce((acc, endpoint) => {
    const tags = endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : ['Untagged'];
    tags.forEach(tag => {
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(endpoint);
    });
    return acc;
  }, {} as Record<string, SwaggerEndpoint[]>);

  // Filter endpoints by search term
  const filteredGroups = groupedEndpoints
    ? Object.entries(groupedEndpoints).reduce((acc, [tag, endpoints]) => {
        const filtered = endpoints.filter(ep => {
          const searchLower = searchTerm.toLowerCase();
          return (
            ep.path.toLowerCase().includes(searchLower) ||
            ep.summary?.toLowerCase().includes(searchLower) ||
            ep.operationId?.toLowerCase().includes(searchLower) ||
            ep.method.toLowerCase().includes(searchLower)
          );
        });
        if (filtered.length > 0) acc[tag] = filtered;
        return acc;
      }, {} as Record<string, SwaggerEndpoint[]>)
    : null;

  return (
    <div className="space-y-4">
      <Tabs value={importMode} onValueChange={(v) => setImportMode(v as 'saved' | 'url' | 'json')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Saved ({savedSwaggers.length})
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        {/* Saved Swaggers Tab */}
        <TabsContent value="saved" className="space-y-3">
          {savedSwaggers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No saved Swagger specs yet.</p>
              <p className="text-sm">Fetch from URL or paste JSON, then save it for later use.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Saved Swagger</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {savedSwaggers.map((saved) => (
                  <div
                    key={saved.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSavedId === saved.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleLoadSaved(saved.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{saved.name}</span>
                        {selectedSavedId === saved.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {saved.url && (
                        <p className="text-xs text-muted-foreground truncate">
                          {saved.url}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Saved: {new Date(saved.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSaved(saved.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-3">
          <div>
            <Label>Swagger/OpenAPI URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/swagger.json"
                onKeyDown={(e) => e.key === 'Enter' && handleFetchSwagger()}
              />
              <Button onClick={handleFetchSwagger} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Fetch'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* JSON Tab */}
        <TabsContent value="json" className="space-y-3">
          <div>
            <Label>Swagger/OpenAPI JSON</Label>
            <Textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Paste your Swagger/OpenAPI JSON here...'
              className="font-mono text-sm mt-1"
            />
          </div>
          <Button onClick={handleParseJson} className="w-full">
            Parse JSON
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {parsedSwagger && (
        <div className="border rounded-lg overflow-hidden">
          {/* API Info Header */}
          <div className="bg-muted/50 p-3 border-b">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{parsedSwagger.info.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  Version: {parsedSwagger.info.version}
                  {parsedSwagger.baseUrl && ` • ${parsedSwagger.baseUrl}`}
                </p>
              </div>
              {/* Save Button */}
              {!saveDialogOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 ml-2"
                  onClick={() => {
                    setSaveName(parsedSwagger.info.title);
                    setSaveDialogOpen(true);
                  }}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
            </div>
            
            {/* Save Dialog */}
            {saveDialogOpen && (
              <div className="mt-3 p-3 bg-background border rounded-md space-y-2">
                <Label>Save as</Label>
                <div className="flex gap-2">
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter name..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSwagger()}
                  />
                  <Button size="sm" onClick={handleSaveSwagger} disabled={!saveName.trim()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {parsedSwagger.info.description && !saveDialogOpen && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {parsedSwagger.info.description}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search endpoints..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Endpoints List */}
          <div className="h-[250px] overflow-y-auto">
            <div className="p-2">
              {filteredGroups && Object.entries(filteredGroups).map(([tag, endpoints]) => (
                <div key={tag} className="mb-2">
                  <button
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-md text-left"
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        expandedTags.has(tag) ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="font-medium">{tag}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {endpoints.length}
                    </Badge>
                  </button>

                  {expandedTags.has(tag) && (
                    <div className="ml-6 space-y-1">
                      {endpoints.map((endpoint, idx) => {
                        const isSelected = selectedEndpoint === endpoint;
                        return (
                          <button
                            key={`${endpoint.method}-${endpoint.path}-${idx}`}
                            onClick={() => handleSelectEndpoint(endpoint)}
                            className={`flex items-center gap-2 w-full p-2 rounded-md text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border border-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <Badge className={`${getMethodColor(endpoint.method)} text-white text-xs w-16 justify-center flex-shrink-0`}>
                              {endpoint.method}
                            </Badge>
                            <span className="font-mono text-xs flex-1 truncate">
                              {endpoint.path}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {filteredGroups && Object.keys(filteredGroups).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No endpoints found
                </p>
              )}
            </div>
          </div>

          {/* Selected Endpoint Preview */}
          {selectedEndpoint && (
            <div className="border-t p-3 bg-muted/30">
              <h4 className="font-medium text-sm mb-2">Selected Endpoint</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className={`${getMethodColor(selectedEndpoint.method)} text-white`}>
                    {selectedEndpoint.method}
                  </Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate">
                    {parsedSwagger.baseUrl}{selectedEndpoint.path}
                  </code>
                </div>
                {selectedEndpoint.summary && (
                  <p className="text-muted-foreground">{selectedEndpoint.summary}</p>
                )}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Parameters: {selectedEndpoint.parameters.map(p => p.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={!selectedEndpoint}
        >
          Import Endpoint
        </Button>
      </div>
    </div>
  );
};
