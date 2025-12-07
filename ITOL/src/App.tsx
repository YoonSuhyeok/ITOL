import { Background, ReactFlow, useNodesState, useEdgesState, addEdge, MarkerType, Connection, useReactFlow, ReactFlowProvider, Node } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import "./App.css";
import { DagServiceInstance } from "./features/dag/services/dag.service";
import FileNode from "@/entities/language/ui/file-node";
import ApiNode from "@/entities/api/ui/api-node";
import DbNode from "@/entities/db/ui/db-node";
import { useCallback, useMemo, useState, useEffect } from "react";
import type FileNodeData from "@/entities/language/model/file-type";
import WindowHeader from "./shared/components/window-header";
import { ExecutionLogPanel } from "./shared/components/execution-log-panel";
import { NodeResultPanel } from "./shared/components/node-result-panel";
import { ApiNodeEditor } from "./shared/components/api-node-editor";
import { DbNodeEditor } from "./shared/components/db-node-editor";
import type { ApiNodeData, DbNodeData } from "./shared/components/settings-modal/types";
import { FileExplorer, type FileItem } from "./shared/components/file-explorer";
import { TabBar, type Tab } from "./shared/components/tab-bar";
import { invoke } from "@tauri-apps/api/core";
import SettingsModal from "./shared/components/settings-modal";

interface Book {
	id: number;
	title: string;
	parent_id: number | null;
	flow_data: string | null;
}

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

	// File Explorer & Tabs state
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string>("");
	const [selectedFileId, setSelectedFileId] = useState<string>();
	const [fileItems, setFileItems] = useState<FileItem[]>([]);
	const [books, setBooks] = useState<Book[]>([]);
	
	// Load books from database
	useEffect(() => {
		const loadBooks = async () => {
			try {
				const allBooks = await invoke<Book[]>("get_all_books_command");
				setBooks(allBooks);
				
				// Convert books to file items
				const items = convertBooksToFileItems(allBooks);
				setFileItems(items);
				
				// Open first book as default tab if exists
				if (allBooks.length > 0 && tabs.length === 0) {
					const firstBook = allBooks[0];
					const newTab: Tab = {
						id: `book-${firstBook.id}`,
						title: firstBook.title,
						type: "flow"
					};
					setTabs([newTab]);
					setActiveTabId(newTab.id);
					
					// Load flow data if exists
					if (firstBook.flow_data) {
						try {
							const flowData = JSON.parse(firstBook.flow_data);
							setNodes(flowData.nodes || []);
							setEdges(flowData.edges || []);
						} catch (e) {
							console.error("Failed to parse flow data:", e);
						}
					}
				}
			} catch (error) {
				console.error("Failed to load books:", error);
			}
		};
		
		loadBooks();
	}, []);
	
	// Convert books to file items hierarchy
	const convertBooksToFileItems = (books: Book[]): FileItem[] => {
		const bookMap = new Map<number, FileItem>();
		const rootItems: FileItem[] = [];
		
		// First pass: create all items
		for (const book of books) {
			const item: FileItem = {
				id: `book-${book.id}`,
				name: book.title,
				type: "folder",
				path: `/book-${book.id}`,
				children: []
			};
			bookMap.set(book.id, item);
		}
		
		// Second pass: build hierarchy
		for (const book of books) {
			const item = bookMap.get(book.id);
			if (!item) continue;
			
			if (book.parent_id === null) {
				rootItems.push(item);
			} else {
				const parent = bookMap.get(book.parent_id);
				if (parent && parent.children) {
					parent.children.push(item);
				}
			}
		}
		
		return rootItems;
	};
	
	// Save current flow data to database
	const saveCurrentFlow = useCallback(async () => {
		if (!activeTabId || !activeTabId.startsWith("book-")) return;
		
		const bookId = Number.parseInt(activeTabId.replace("book-", ""));
		const flowData = JSON.stringify({ nodes, edges });
		
		try {
			const currentBook = books.find(b => b.id === bookId);
			if (currentBook) {
				await invoke("update_book_command", {
					id: bookId,
					title: currentBook.title,
					parentId: currentBook.parent_id,
					flowData: flowData
				});
			}
		} catch (error) {
			console.error("Failed to save flow:", error);
		}
	}, [activeTabId, nodes, edges, books]);

	// API Node Editor state
	const [apiEditorOpen, setApiEditorOpen] = useState(false);
	const [editingApiNode, setEditingApiNode] = useState<{ nodeId: string; data: ApiNodeData } | null>(null);

	// DB Node Editor state
	const [dbEditorOpen, setDbEditorOpen] = useState(false);
	const [editingDbNode, setEditingDbNode] = useState<{ nodeId: string; data: DbNodeData } | null>(null);

	// Settings Modal state
	const [settingsOpen, setSettingsOpen] = useState(false);

	// File click handler
	const handleFileClick = useCallback((item: FileItem) => {
		setSelectedFileId(item.id);
		
		if (item.id.startsWith("book-")) {
			// Check if tab already exists
			const existingTab = tabs.find(tab => tab.id === item.id);
			
			if (!existingTab) {
				const newTab: Tab = {
					id: item.id,
					title: item.name,
					type: "flow"
				};
				
				setTabs(prev => [...prev, newTab]);
			}
			
			// Save current flow before switching
			if (activeTabId && activeTabId !== item.id) {
				saveCurrentFlow();
			}
			
			// Load the book's flow data
			const bookId = Number.parseInt(item.id.replace("book-", ""));
			const book = books.find(b => b.id === bookId);
			if (book && book.flow_data) {
				try {
					const flowData = JSON.parse(book.flow_data);
					setNodes(flowData.nodes || []);
					setEdges(flowData.edges || []);
				} catch (e) {
					console.error("Failed to parse flow data:", e);
					setNodes([]);
					setEdges([]);
				}
			} else {
				setNodes([]);
				setEdges([]);
			}
			
			setActiveTabId(item.id);
		}
	}, [tabs, books, activeTabId, saveCurrentFlow, setNodes, setEdges]);

	// Tab handlers
	const handleTabClick = useCallback((tabId: string) => {
		if (activeTabId !== tabId) {
			// Save current flow before switching
			saveCurrentFlow();
			
			// Load the new tab's flow data
			const bookId = Number.parseInt(tabId.replace("book-", ""));
			const book = books.find(b => b.id === bookId);
			if (book && book.flow_data) {
				try {
					const flowData = JSON.parse(book.flow_data);
					setNodes(flowData.nodes || []);
					setEdges(flowData.edges || []);
				} catch (e) {
					console.error("Failed to parse flow data:", e);
					setNodes([]);
					setEdges([]);
				}
			} else {
				setNodes([]);
				setEdges([]);
			}
			
			setActiveTabId(tabId);
		}
	}, [activeTabId, books, saveCurrentFlow, setNodes, setEdges]);

	const handleTabClose = useCallback((tabId: string) => {
		// Save before closing
		if (activeTabId === tabId) {
			saveCurrentFlow();
		}
		
		setTabs(prev => {
			const newTabs = prev.filter(tab => tab.id !== tabId);
			
			// If closing active tab, switch to another tab
			if (activeTabId === tabId && newTabs.length > 0) {
				const newActiveId = newTabs[newTabs.length - 1].id;
				
				// Load the new active tab's flow data
				const bookId = Number.parseInt(newActiveId.replace("book-", ""));
				const book = books.find(b => b.id === bookId);
				if (book && book.flow_data) {
					try {
						const flowData = JSON.parse(book.flow_data);
						setNodes(flowData.nodes || []);
						setEdges(flowData.edges || []);
					} catch (e) {
						console.error("Failed to parse flow data:", e);
						setNodes([]);
						setEdges([]);
					}
				} else {
					setNodes([]);
					setEdges([]);
				}
				
				setActiveTabId(newActiveId);
			} else if (newTabs.length === 0) {
				setActiveTabId("");
				setNodes([]);
				setEdges([]);
			}
			
			return newTabs;
		});
	}, [activeTabId, books, saveCurrentFlow, setNodes, setEdges]);

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

	// API 노드 생성 함수
	const createApiNode = useCallback((apiData: ApiNodeData) => {
		const newNodeId = `api-node-${Date.now()}`;
		const newNode: any = {
			id: newNodeId,
			type: 'apiNode',
			position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
			data: apiData
		};
		
		setNodes((nds: any) => [...nds, newNode]);
		DagServiceInstance.addNode(newNode as any);
		
		return newNodeId;
	}, [setNodes]);

	// API 노드 업데이트 함수
	const updateApiNode = useCallback((nodeId: string, apiData: ApiNodeData) => {
		setNodes((nds: any) => 
			nds.map((node: any) => 
				node.id === nodeId 
					? { ...node, data: apiData }
					: node
			)
		);
		// DagService에도 업데이트 반영
		const updatedNode = {
			id: nodeId,
			type: 'apiNode',
			data: apiData
		};
		DagServiceInstance.updateNode(updatedNode as any);
	}, [setNodes]);

	// DB 노드 생성 함수
	const createDbNode = useCallback((dbData: DbNodeData) => {
		const newNodeId = `db-node-${Date.now()}`;
		const newNode: any = {
			id: newNodeId,
			type: 'dbNode',
			position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
			data: dbData
		};
		
		setNodes((nds: any) => [...nds, newNode]);
		DagServiceInstance.addNode(newNode as any);
		
		return newNodeId;
	}, [setNodes]);

	// DB 노드 업데이트 함수
	const updateDbNode = useCallback((nodeId: string, dbData: DbNodeData) => {
		setNodes((nds: any) => 
			nds.map((node: any) => 
				node.id === nodeId 
					? { ...node, data: dbData }
					: node
			)
		);
		// DagService에도 업데이트 반영
		const updatedNode = {
			id: nodeId,
			type: 'dbNode',
			data: dbData
		};
		DagServiceInstance.updateNode(updatedNode as any);
	}, [setNodes]);

	// 노드 더블클릭 핸들러
	const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
		if (node.type === 'apiNode') {
			setEditingApiNode({ nodeId: node.id, data: node.data as unknown as ApiNodeData });
			setApiEditorOpen(true);
		} else if (node.type === 'dbNode') {
			setEditingDbNode({ nodeId: node.id, data: node.data as unknown as DbNodeData });
			setDbEditorOpen(true);
		}
	}, []);

	// API Editor 저장 핸들러
	const handleApiEditorSave = useCallback((data: ApiNodeData) => {
		if (editingApiNode) {
			// 편집 모드
			updateApiNode(editingApiNode.nodeId, data);
		} else {
			// 생성 모드
			createApiNode(data);
		}
		setApiEditorOpen(false);
		setEditingApiNode(null);
	}, [editingApiNode, updateApiNode, createApiNode]);

	// DB Editor 저장 핸들러
	const handleDbEditorSave = useCallback((data: DbNodeData) => {
		if (editingDbNode) {
			// 편집 모드
			updateDbNode(editingDbNode.nodeId, data);
		} else {
			// 생성 모드
			createDbNode(data);
		}
		setDbEditorOpen(false);
		setEditingDbNode(null);
	}, [editingDbNode, updateDbNode, createDbNode]);

	// API Editor 닫기 핸들러
	const handleApiEditorClose = useCallback(() => {
		setApiEditorOpen(false);
		setEditingApiNode(null);
	}, []);

	const handleDbEditorClose = useCallback(() => {
		setDbEditorOpen(false);
		setEditingDbNode(null);
	}, []);

	const nodeTypes = useMemo(
		() => ({
			languageNode: (nodeProps: any) => <FileNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />,
			apiNode: (nodeProps: any) => <ApiNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />,
			dbNode: (nodeProps: any) => <DbNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />
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
		<div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
			<WindowHeader onSettingsClick={() => setSettingsOpen(true)} />
			<div style={{ 
				width: "100%", 
				flex: 1,
				overflow: "hidden",
				display: "flex",
				flexDirection: "row"
			}}>
				{/* Left Sidebar - File Explorer */}
				<div style={{ width: "250px", height: "100%", borderRight: "1px solid var(--border)" }}>
					<FileExplorer 
						items={fileItems}
						onFileClick={handleFileClick}
						selectedId={selectedFileId}
					/>
				</div>

				{/* Main Content Area */}
				<div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
					{/* Tab Bar */}
					<TabBar 
						tabs={tabs}
						activeTabId={activeTabId}
						onTabClick={handleTabClick}
						onTabClose={handleTabClose}
					/>

					{/* Content Area */}
					<div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
						{activeTabId && activeTabId.startsWith("book-") ? (
							<>
								<div style={{ flex: 1, position: "relative" }}>
									<ReactFlow
										nodeTypes={nodeTypes}
										nodes={nodes}
										edges={edges}
										onNodesChange={onNodesChange}
										onEdgesChange={onEdgesChange}
										onConnect={onConnect}
										onConnectEnd={onConnectEnd}
										onNodeDoubleClick={onNodeDoubleClick}
									>
										<Background />
									</ReactFlow>
									<NodeResultPanel />
								</div>
								<ExecutionLogPanel />
							</>
						) : (
							<div style={{ flex: 1, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
								<div style={{ textAlign: "center" }}>
									<h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>No Flow Selected</h2>
									<p style={{ color: "var(--muted-foreground)" }}>Select a flow from the explorer to start editing</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			<ApiNodeEditor
				isOpen={apiEditorOpen}
				onClose={handleApiEditorClose}
				initialData={editingApiNode?.data}
				onSave={handleApiEditorSave}
				mode={editingApiNode ? 'edit' : 'create'}
			/>
			<DbNodeEditor
				isOpen={dbEditorOpen}
				onClose={handleDbEditorClose}
				initialData={editingDbNode?.data}
				onSave={handleDbEditorSave}
				mode={editingDbNode ? 'edit' : 'create'}
			/>
			<SettingsModal
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				onCreateFileNode={createFileNode}
				onCreateApiNode={() => {
					setEditingApiNode(null);
					setApiEditorOpen(true);
					setSettingsOpen(false);
				}}
				onCreateDbNode={() => {
					setEditingDbNode(null);
					setDbEditorOpen(true);
					setSettingsOpen(false);
				}}
			/>
		</div>
	);
}
