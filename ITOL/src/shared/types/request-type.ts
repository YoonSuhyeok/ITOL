
interface RequestPoroperty {
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    description: string;
}
interface ReuqestBody {
	properties: RequestPoroperty[];
}

export default ReuqestBody;
