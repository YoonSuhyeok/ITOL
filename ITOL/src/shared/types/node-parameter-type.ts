interface Parameter {
	id: string;
	enabled: boolean;
	key: string | null;
	value: string | null;
	checked: boolean;
	type: "string" | "number" | "boolean" | "object" | "array";
	valueSource: "linked" | "dynamic" | "reference";  // "reference" 추가
	sourcePath: string;
	sourceNodeLabel: string;
	sourceNodeId: string;
	
	// 노드 참조를 위한 새로운 필드들
	referenceNodeId?: string;
	referencePath?: string;
	displayReference?: string;
}

export default Parameter;
