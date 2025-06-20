interface FileNodeData extends Record<string, unknown> {
	fileExtension: "ts" | "js";
	fileName: string;
	filePath: string;
}

export default FileNodeData;
