import { ReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import fileNode from "@/entities/language/ui/file-node";

import "./App.css";

const nodeTypes = {
	languageNode: fileNode,
};

const initialNodes = [
	{
		type: "languageNode",
		id: "1",
		position: { x: 0, y: 0 },
		data: {
			label: "1",
			fileName: "example",
			fileExtension: "ts",
		},
	},
	{ id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];

const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

export default function App() {
	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<ReactFlow
				nodeTypes={nodeTypes}
				nodes={initialNodes}
				edges={initialEdges}
			/>
		</div>
	);
}
