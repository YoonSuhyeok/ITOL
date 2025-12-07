/**
 * Swagger/OpenAPI Parser
 * Parses OpenAPI 2.0 (Swagger) and OpenAPI 3.x specifications
 */

import type { HttpMethod, KeyValuePair, AuthConfig, RequestBody } from '../components/settings-modal/types';

// Store for resolving $ref references
let definitionsStore: Record<string, unknown> = {};

export interface SwaggerEndpoint {
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: SwaggerParameter[];
  requestBody?: SwaggerRequestBody;
  security?: Array<Record<string, string[]>>;
}

export interface SwaggerParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: {
    type?: string;
    format?: string;
    default?: unknown;
    enum?: unknown[];
  };
}

export interface SwaggerRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, {
    schema?: unknown;
    example?: unknown;
  }>;
}

export interface SwaggerSecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: string;
  flows?: unknown;
}

export interface ParsedSwagger {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  baseUrl: string;
  endpoints: SwaggerEndpoint[];
  securitySchemes?: Record<string, SwaggerSecurityScheme>;
}

/**
 * Parse Swagger/OpenAPI JSON specification
 */
export function parseSwagger(spec: unknown): ParsedSwagger {
  const swagger = spec as Record<string, unknown>;
  
  // Determine OpenAPI version
  const isOpenAPI3 = 'openapi' in swagger && typeof swagger.openapi === 'string' && swagger.openapi.startsWith('3.');
  const isSwagger2 = 'swagger' in swagger && swagger.swagger === '2.0';
  
  if (!isOpenAPI3 && !isSwagger2) {
    throw new Error('Unsupported specification format. Expected OpenAPI 3.x or Swagger 2.0');
  }

  // Store definitions/components for $ref resolution
  if (isSwagger2) {
    definitionsStore = swagger.definitions as Record<string, unknown> || {};
  } else {
    const components = swagger.components as Record<string, unknown> || {};
    definitionsStore = components.schemas as Record<string, unknown> || {};
  }

  const info = swagger.info as { title?: string; version?: string; description?: string } || {};
  
  // Build base URL
  let baseUrl = '';
  if (isOpenAPI3) {
    const servers = swagger.servers as Array<{ url?: string }> | undefined;
    baseUrl = servers?.[0]?.url || '';
  } else {
    // Swagger 2.0
    const host = swagger.host as string || '';
    const basePath = swagger.basePath as string || '';
    const schemes = swagger.schemes as string[] || ['https'];
    baseUrl = `${schemes[0]}://${host}${basePath}`;
  }

  // Parse paths
  const paths = swagger.paths as Record<string, Record<string, unknown>> || {};
  const endpoints: SwaggerEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;
    
    for (const method of httpMethods) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (!operation) continue;

      const endpoint: SwaggerEndpoint = {
        path,
        method: method.toUpperCase() as HttpMethod,
        operationId: operation.operationId as string | undefined,
        summary: operation.summary as string | undefined,
        description: operation.description as string | undefined,
        tags: operation.tags as string[] | undefined,
        parameters: [],
        security: operation.security as Array<Record<string, string[]>> | undefined,
      };

      // Parse parameters (OpenAPI 3.x and Swagger 2.0)
      const params = [
        ...((pathItem.parameters as unknown[]) || []),
        ...((operation.parameters as unknown[]) || []),
      ] as Array<Record<string, unknown>>;

      for (const param of params) {
        const swaggerParam: SwaggerParameter = {
          name: param.name as string,
          in: param.in as 'query' | 'header' | 'path' | 'cookie',
          description: param.description as string | undefined,
          required: param.required as boolean | undefined,
        };

        // Handle schema (OpenAPI 3.x)
        if (param.schema) {
          swaggerParam.schema = param.schema as SwaggerParameter['schema'];
        } else {
          // Swagger 2.0 style
          swaggerParam.schema = {
            type: param.type as string | undefined,
            format: param.format as string | undefined,
            default: param.default,
            enum: param.enum as unknown[] | undefined,
          };
        }

        endpoint.parameters!.push(swaggerParam);
      }

      // Parse request body (OpenAPI 3.x)
      if (isOpenAPI3 && operation.requestBody) {
        endpoint.requestBody = operation.requestBody as SwaggerRequestBody;
      }

      // Swagger 2.0 body parameter
      if (isSwagger2) {
        const bodyParam = params.find(p => p.in === 'body');
        if (bodyParam) {
          endpoint.requestBody = {
            description: bodyParam.description as string | undefined,
            required: bodyParam.required as boolean | undefined,
            content: {
              'application/json': {
                schema: bodyParam.schema,
              },
            },
          };
        }
      }

      endpoints.push(endpoint);
    }
  }

  // Parse security schemes
  let securitySchemes: Record<string, SwaggerSecurityScheme> | undefined;
  
  if (isOpenAPI3) {
    const components = swagger.components as Record<string, unknown> | undefined;
    securitySchemes = components?.securitySchemes as Record<string, SwaggerSecurityScheme> | undefined;
  } else {
    securitySchemes = swagger.securityDefinitions as Record<string, SwaggerSecurityScheme> | undefined;
  }

  return {
    info: {
      title: info.title || 'Unknown API',
      version: info.version || '1.0.0',
      description: info.description,
    },
    baseUrl,
    endpoints,
    securitySchemes,
  };
}

/**
 * Convert Swagger endpoint to API Node data fields
 */
export function convertEndpointToApiData(
  endpoint: SwaggerEndpoint,
  baseUrl: string,
  securitySchemes?: Record<string, SwaggerSecurityScheme>
): {
  method: HttpMethod;
  url: string;
  name: string;
  description: string;
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  auth: AuthConfig;
  body: RequestBody;
  pathParams: KeyValuePair[];
} {
  let url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`;
  
  // Convert parameters
  const queryParams: KeyValuePair[] = [];
  const headers: KeyValuePair[] = [];
  const pathParams: KeyValuePair[] = [];

  for (const param of endpoint.parameters || []) {
    const kvPair: KeyValuePair = {
      key: param.name,
      value: param.schema?.default?.toString() || '',
      description: param.description || '',
      enabled: param.required ?? false,
    };

    switch (param.in) {
      case 'query':
        queryParams.push(kvPair);
        break;
      case 'header':
        headers.push(kvPair);
        break;
      case 'path':
        // For path params, set enabled to true by default (they're required)
        kvPair.enabled = true;
        pathParams.push(kvPair);
        break;
    }
  }

  // Replace path parameters in URL with placeholder values for display
  // Keep the {paramName} format so user knows where to fill in
  // The actual value will be substituted when making the request

  // Determine auth type from security schemes
  let auth: AuthConfig = { type: 'none' };
  
  if (endpoint.security && endpoint.security.length > 0 && securitySchemes) {
    const securityRequirement = endpoint.security[0];
    const schemeName = Object.keys(securityRequirement)[0];
    const scheme = securitySchemes[schemeName];

    if (scheme) {
      if (scheme.type === 'http' && scheme.scheme === 'bearer') {
        auth = { type: 'bearer', token: '' };
      } else if (scheme.type === 'http' && scheme.scheme === 'basic') {
        auth = { type: 'basic', username: '', password: '' };
      } else if (scheme.type === 'apiKey') {
        auth = { 
          type: 'api-key', 
          apiKeyHeader: scheme.name || 'X-API-Key',
          apiKey: '' 
        };
      } else if (scheme.type === 'oauth2') {
        auth = { type: 'oauth2', oauth2: { accessToken: '', tokenType: 'Bearer' } };
      }
    }
  }

  // Convert request body
  let body: RequestBody = { type: 'none' };
  
  if (endpoint.requestBody?.content) {
    const contentTypes = Object.keys(endpoint.requestBody.content);
    
    if (contentTypes.includes('application/json')) {
      const jsonContent = endpoint.requestBody.content['application/json'];
      let rawBody = '';
      
      if (jsonContent.example) {
        rawBody = JSON.stringify(jsonContent.example, null, 2);
      } else if (jsonContent.schema) {
        // Generate sample from schema
        rawBody = generateSampleFromSchema(jsonContent.schema);
      }
      
      body = { type: 'json', raw: rawBody };
    } else if (contentTypes.includes('application/x-www-form-urlencoded')) {
      body = { type: 'x-www-form-urlencoded', urlEncoded: [] };
    } else if (contentTypes.includes('multipart/form-data')) {
      body = { type: 'form-data', formData: [] };
    }
  }

  return {
    method: endpoint.method,
    url,
    name: endpoint.summary || endpoint.operationId || `${endpoint.method} ${endpoint.path}`,
    description: endpoint.description || '',
    queryParams,
    headers,
    auth,
    body,
    pathParams,
  };
}

/**
 * Generate sample JSON from OpenAPI schema
 */
function generateSampleFromSchema(schema: unknown): string {
  try {
    const sample = generateValueFromSchema(schema as Record<string, unknown>);
    return JSON.stringify(sample, null, 2);
  } catch {
    return '{}';
  }
}

function generateValueFromSchema(schema: Record<string, unknown>, depth = 0): unknown {
  if (!schema || depth > 5) return null; // Prevent infinite recursion

  // Resolve $ref if present
  if (schema.$ref) {
    const refPath = schema.$ref as string;
    // Extract definition name from "#/definitions/Pet" or "#/components/schemas/Pet"
    const parts = refPath.split('/');
    const defName = parts[parts.length - 1];
    const resolvedSchema = definitionsStore[defName] as Record<string, unknown>;
    if (resolvedSchema) {
      return generateValueFromSchema(resolvedSchema, depth + 1);
    }
    return null;
  }

  const type = schema.type as string;
  const example = schema.example;
  
  if (example !== undefined) return example;

  switch (type) {
    case 'object': {
      const properties = schema.properties as Record<string, unknown> | undefined;
      if (!properties) {
        // If no properties but has additionalProperties, generate sample
        if (schema.additionalProperties) {
          return { "key": "value" };
        }
        return {};
      }
      
      const obj: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        obj[key] = generateValueFromSchema(propSchema as Record<string, unknown>, depth + 1);
      }
      return obj;
    }
    case 'array': {
      const items = schema.items as Record<string, unknown> | undefined;
      if (!items) return [];
      return [generateValueFromSchema(items, depth + 1)];
    }
    case 'string': {
      const format = schema.format as string;
      const enumValues = schema.enum as string[] | undefined;
      if (enumValues && enumValues.length > 0) return enumValues[0];
      if (format === 'date') return '2024-01-01';
      if (format === 'date-time') return '2024-01-01T00:00:00Z';
      if (format === 'email') return 'user@example.com';
      if (format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      if (format === 'uri' || format === 'url') return 'https://example.com';
      return schema.default || 'string';
    }
    case 'integer': {
      const format = schema.format as string;
      if (format === 'int64') return 0;
      return schema.default ?? 0;
    }
    case 'number':
      return schema.default ?? 0.0;
    case 'boolean':
      return schema.default ?? false;
    default:
      // If no type but has $ref in items or properties, try to resolve
      if (schema.allOf) {
        const allOfSchemas = schema.allOf as Record<string, unknown>[];
        const merged: Record<string, unknown> = {};
        for (const subSchema of allOfSchemas) {
          const result = generateValueFromSchema(subSchema, depth + 1);
          if (typeof result === 'object' && result !== null) {
            Object.assign(merged, result);
          }
        }
        return merged;
      }
      return null;
  }
}

/**
 * Fetch and parse Swagger from URL
 */
export async function fetchSwagger(url: string): Promise<ParsedSwagger> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Swagger spec: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  let spec: unknown;

  if (contentType?.includes('yaml') || url.endsWith('.yaml') || url.endsWith('.yml')) {
    // For YAML, we'd need a YAML parser - for now, assume JSON
    throw new Error('YAML format is not supported yet. Please provide a JSON URL.');
  }

  spec = await response.json();
  return parseSwagger(spec);
}
