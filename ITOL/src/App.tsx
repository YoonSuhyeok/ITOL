import { Background, ReactFlow, Node, useNodesState, useEdgesState, addEdge, MarkerType } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import fileNode from "@/entities/language/ui/file-node";

import "./App.css";
import { DagServiceInstance } from "./features/dag/services/dag.service";
import type FileNodeData from "@/entities/language/model/file-type";
import FileNode from "@/entities/language/ui/file-node";
import { useCallback } from "react";

export default function App() {

	// const nodes: Node<FileNodeData>[] = DagServiceInstance.getNodeData();
	// const edges = DagServiceInstance.getEdgeData();
	const [nodes, setNodes, onNodesChange] = useNodesState(DagServiceInstance.getNodeData());

	const nodeTypes = {
		languageNode: (nodeProps: any) => <FileNode {...nodeProps} setNodes={setNodes} />
	};

	const [edges, setEdges, onEdgesChange] = useEdgesState(DagServiceInstance.getEdgeData());
	const onConnect = useCallback(
		(connection) => {
		  setEdges((oldEdges) => {
			const newEdges = addEdge(
			  {
				...connection,
				markerEnd: { type: MarkerType.ArrowClosed },
			  },
			  oldEdges
			);
			DagServiceInstance.setEdgeData(newEdges); // 서비스에 동기화
			return newEdges;
		  });
		},
		[setEdges]
	  );

	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<ReactFlow
				nodeTypes={nodeTypes}
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
			>
				<Background />
			</ReactFlow>
		</div>
	);
}
