import JsonSchemaViewer from 'react-json-schema-viewer';

const sampleSchema = {
  "type": "object",
  "properties": {
    "targets": {
      "type": "array",
      "items": {
        "type": "number"
      }
    }
  },
  "required": ["targets"],
  "additionalProperties": false
}

function renderTypeDefinition(type: Record<string, any>): import("react").ReactNode {
    try {
        return (
            <JsonSchemaViewer schema={sampleSchema} />
        );
    } catch (error) {
        console.error('JsonSchemaViewer error:', error);
        return <div className="text-red-500">Error rendering schema</div>;
    }
}

export default renderTypeDefinition;