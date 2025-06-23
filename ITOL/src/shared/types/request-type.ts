
export interface RequestProperty {
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    description: string;
}
export interface RequestBody {
	properties: RequestProperty[];
}