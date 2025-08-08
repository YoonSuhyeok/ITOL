import { Background, ReactFlow, useNodesState, useEdgesState, addEdge, MarkerType, Connection, useReactFlow, ReactFlowProvider } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import "./App.css";
import { DagServiceInstance } from "./features/dag/services/dag.service";
import FileNode from "@/entities/language/ui/file-node";
import { useCallback, useMemo } from "react";
import type FileNodeData from "@/entities/language/model/file-type";
import WindowHeader from "./shared/components/window-header";
import Toolbar from "./shared/components/toolbar";

export default function App() {
	return (
		<ReactFlowProvider>
			<FlowCanvas />
		</ReactFlowProvider>
	);
}

function FlowCanvas() {
	// const nodes: Node<FileNodeData>[] = DagServiceInstance.getNodeData();
	// const edges = DagServiceInstance.getEdgeData();
	const [nodes, setNodes, onNodesChange] = useNodesState(DagServiceInstance.getNodeData());
	const [edges, setEdges, onEdgesChange] = useEdgesState(DagServiceInstance.getEdgeData());
	const { screenToFlowPosition } = useReactFlow();

	// 새로운 노드 생성 함수
	const createNewNode = useCallback((position: { x: number; y: number }, sourceNodeId?: string) => {
		const newNodeId = `node-${Date.now()}`;
		const newNode = {
			id: newNodeId,
			type: 'languageNode',
			position,
			data: {
				fileName: `NewFile${nodes.length + 1}`,
				fileExtension: 'ts' as const,
				filePath: `/new-file-${nodes.length + 1}.ts`,
				requestProperties: []
			}
		};
		
		setNodes((nds) => [...nds, newNode]);
		
		// DagService에도 노드 추가
		DagServiceInstance.addNode(newNode);
		
		// 소스 노드가 있으면 자동으로 연결
		if (sourceNodeId) {
			setEdges((eds) => {
				const newEdges = addEdge({
					id: `${sourceNodeId}-${newNodeId}`,
					source: sourceNodeId,
					target: newNodeId,
					markerEnd: { type: MarkerType.ArrowClosed },
				}, eds);
				
				// DagService에 엣지 데이터 동기화
				try {
					DagServiceInstance.setEdgeData(newEdges);
					console.log("Auto-connection successful");
				} catch (error) {
					console.error("Failed to auto-connect:", error);
					// 오류 발생 시 엣지 연결 취소
					return eds;
				}
				
				return newEdges;
			});
		}
		
		return newNodeId;
	}, [nodes.length, setNodes, setEdges]);

	// 파일 노드 생성 함수 (설정 모달에서 사용)
	const createFileNode = useCallback((filePath: string, fileName: string, fileExtension: string) => {
		const newNodeId = `node-${Date.now()}`;
		
		// 파일 확장자를 ts/js로 매핑
		const mappedExtension = (fileExtension === 'tsx' || fileExtension === 'ts') ? 'ts' : 'js';
		
		const newNode = {
			id: newNodeId,
			type: 'languageNode',
			position: { x: Math.random() * 400, y: Math.random() * 400 }, // 랜덤 위치
			data: {
				fileName: fileName.split('.')[0], // 확장자 제거
				fileExtension: mappedExtension as any,
				filePath: filePath,
				requestProperties: []
			}
		};
		
		setNodes((nds) => [...nds, newNode]);
		
		// DagService에도 동기화
		DagServiceInstance.addNode(newNode);
		
		return newNodeId;
	}, [setNodes]);

	const nodeTypes = useMemo(
		() => ({
			languageNode: (nodeProps: any) => <FileNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />
		}),
		[setNodes, setEdges]
	);

	const onConnect = useCallback(
		(connection: Connection) => {
		  setEdges((oldEdges) => {
			const newEdges = addEdge(
			  {
				...connection,
				markerEnd: { type: MarkerType.ArrowClosed },
			  },
			  oldEdges
			);
			
			// DagService에 엣지 데이터 동기화
			try {
			  DagServiceInstance.setEdgeData(newEdges);
			  console.log("Edge connection successful:", connection);
			} catch (error) {
			  console.error("Failed to add edge:", error);
			  // 순환 참조 등의 오류가 발생하면 엣지 추가를 취소
			  return oldEdges;
			}
			
			return newEdges;
		  });
		},
		[setEdges]
	  );

	// 핸들을 빈 공간에 놓았을 때 새 노드 생성
	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent, connectionState: any) => {
			// 연결이 실제로 이루어지지 않았을 때만 새 노드 생성
			if (!connectionState.isValid && connectionState.fromNode) {
				const targetIsPane = (event.target as Element)?.classList.contains('react-flow__pane');
				
				if (targetIsPane) {
					// 마우스 위치를 flow 좌표계로 변환
					const position = screenToFlowPosition({
						x: (event as MouseEvent).clientX,
						y: (event as MouseEvent).clientY,
					});
					
					// 새 노드 생성
					createNewNode(position, connectionState.fromNode.id);
				}
			}
		},
		[screenToFlowPosition, createNewNode]
	);

	return (
		<div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
			<WindowHeader />
			<div style={{ 
				width: "100%", 
				height: "calc(100vh - 113px)", /* 헤더 높이(65px) + 툴바 높이(48px)만큼 빼기 */
				marginTop: "65px",
				overflow: "hidden" 
			}}>
				<ReactFlow
					nodeTypes={nodeTypes}
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
				>
					<Background />
				</ReactFlow>
			</div>
			<Toolbar onCreateFileNode={createFileNode} />
		</div>
	);
}
