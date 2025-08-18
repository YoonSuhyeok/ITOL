
export interface RequestProperty {
    nodeName: string | undefined;
    key: string;
    value: string | null | number | boolean;
    type: "string" | "number" | "boolean" | "object" | "array";
    description: string;
    
    // 노드 간 값 참조를 위한 필드들
    referenceNodeId?: string;
    referencePath?: string;
    displayReference?: string;
}
export interface RequestBody {
	properties: RequestProperty[];
}