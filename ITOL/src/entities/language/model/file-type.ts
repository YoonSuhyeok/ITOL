import { RequestProperty } from "@/shared/types/request-type";

interface FileNodeData extends Record<string, unknown> {
	fileExtension: "ts" | "js";
	fileName: string;
	filePath: string;
	requestProperties: RequestProperty[];
}

export default FileNodeData;
