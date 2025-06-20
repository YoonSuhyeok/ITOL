import { Background, ReactFlow, Node } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import fileNode from "@/entities/language/ui/file-node";

import "./App.css";
import { DagServiceInstance } from "./features/dag/services/dag.service";
import type FileNodeData from "@/entities/language/model/file-type";

const nodeTypes = {
	languageNode: fileNode,
};

export default function App() {

	const initialNodes: Node<FileNodeData>[] = DagServiceInstance.getNodeData();
	
	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<ReactFlow
				nodeTypes={nodeTypes}
				nodes={initialNodes}
			>
				<Background />
			</ReactFlow>
		</div>
	);
}
