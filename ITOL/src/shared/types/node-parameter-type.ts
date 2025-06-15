interface Parameter {
	id: string;
	enabled: boolean;
	key: string;
	value: string;
	checked: boolean;
	type: "string" | "number" | "boolean" | "object" | "array";
	valueSource: "linked" | "dynamic";
	sourcePath: string;
	sourceNodeLabel: string;
	sourceNodeId: string;
}

export default Parameter;
