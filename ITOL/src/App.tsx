import { Background, ReactFlow, Node, useNodesState, useEdgesState } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import fileNode from "@/entities/language/ui/file-node";

import "./App.css";
import { DagServiceInstance } from "./features/dag/services/dag.service";
import type FileNodeData from "@/entities/language/model/file-type";
import FileNode from "@/entities/language/ui/file-node";

export default function App() {

	// const nodes: Node<FileNodeData>[] = DagServiceInstance.getNodeData();
	// const edges = DagServiceInstance.getEdgeData();

	const [nodes, setNodes, onNodesChange] = useNodesState(DagServiceInstance.getNodeData());
	const [edges, setEdges, onEdgesChange] = useEdgesState(DagServiceInstance.getEdgeData());

	const nodeTypes = {
		languageNode: (props) => (
			<FileNode {...props} edges={edges} setEdges={setEdges} />
		),
	};
	
	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<ReactFlow
				nodeTypes={nodeTypes}
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				// onConnect={onConnect}
			>
				<Background />
			</ReactFlow>
		</div>
	);
}
