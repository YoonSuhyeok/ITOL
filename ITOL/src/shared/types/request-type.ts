
interface RequestProperty {
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    description: string;
}
interface RequestBody {
	properties: RequestProperty[];
}

export default RequestBody;
