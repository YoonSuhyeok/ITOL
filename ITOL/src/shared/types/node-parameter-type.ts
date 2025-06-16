interface Parameter {
	id: string;
	enabled: boolean;
	key: string | null;
	value: string | null;
	checked: boolean;
	type: "string" | "number" | "boolean" | "object" | "array";
	valueSource: "linked" | "dynamic";
	sourcePath: string;
	sourceNodeLabel: string;
	sourceNodeId: string;
}

export default Parameter;
