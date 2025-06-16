import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type NodeType from "@/shared/types/node-type";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Handle, Position } from "@xyflow/react";
import {
	Check,
	ChevronDown,
	ChevronUp,
	Code,
	Hammer,
	Play,
	Save,
	X,
} from "lucide-react";
import { memo, useState } from "react";
import type FileNodeData from "../model/file-type";
import FileViewModel from "../model/file-view-model";
import { Badge } from "@/shared/components/ui/badge";
import renderTypeDefinition from "@/shared/components/renderTypeDefinition";
import ParameterForm from "@/shared/components/parameter";

const handleSave = () => {};

const handleRun = () => {};
const handleBuild = () => {};

function FileNode({ id, type, data }: NodeType<FileNodeData>) {
	const {
		isRunning,
		isSaving,
		runSuccess,
		isParameterSectionCollapsed,			
		setIsParameterSectionCollapsed,
		isNodeMinimized,
		setIsNodeMinimized,
		showTypeDefinition,
		setShowTypeDefinition,
		saveSuccess,
		setSaveSuccess,
		isBuilding,
		setIsBuilding,
	} = FileViewModel();
	const [requestType, setRequestType] = useState()
	const [responseType, setResponseType] = useState()

	return (
		<div
			className={cn(
				"bg-background border rounded-md shadow-md w-[500px] relative before:absolute before:inset-[-2px] before:rounded-lg before:bg-black/50 before:blur-[2px] before:-z-10",
				(isRunning || isSaving) &&
					"ring-2 ring-offset-2 ring-offset-background transition-all",
				isRunning && "ring-blue-500",
				isSaving && "ring-amber-500",
				runSuccess === true && "ring-green-500",
				runSuccess === false && "ring-red-500",
			)}
		>
			{/* 로딩 테두리 애니메이션 */}
			{(isRunning || isSaving) && (
				<div className="absolute inset-[-4px] rounded-lg z-[-5] overflow-hidden">
					<div
						className={cn(
							"absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer",
							isRunning && "via-blue-400",
							isSaving && "via-amber-400",
						)}
						style={{ backgroundSize: "200% 100%" }}
					/>
				</div>
			)}

			{/* 헤더 */}
			<div className="flex items-center p-2 border-b bg-muted/30">
				<div className="flex items-center gap-1">
					<div
						className={cn(
							"text-white font-bold p-1 text-xs rounded",
							data.fileExtension === "ts" ? "bg-blue-500" : "bg-yellow-500",
						)}
					>
						{data.fileExtension === "ts" ? "TS" : "JS"}
					</div>
				</div>

				<div className="ml-4 text-sm font-medium">{data.fileName}</div>

				<div className="ml-auto flex items-center gap-1">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => setIsNodeMinimized(!isNodeMinimized)}
								>
									{isNodeMinimized ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronUp className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{isNodeMinimized ? "Expand" : "Minimize"}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					{/* TypeScript 노드에서만 타입 정의 버튼 표시 (노드가 확장되었을 때만) */}
					{!isNodeMinimized && data.fileExtension === "ts" && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => setShowTypeDefinition(!showTypeDefinition)}
									>
										<Code className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>타입 정의 보기</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{/* Build 버튼은 TypeScript 노드에서만 표시 */}
					{data.fileExtension === "ts" && (
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-8 w-8 relative",
								isBuilding && "bg-amber-100 text-amber-600",
							)}
							onClick={handleBuild}
							disabled={isBuilding}
						>
							{isBuilding ? (
								<span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
							) : (
								<Hammer className="h-4 w-4" />
							)}
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							"h-8 w-8 relative",
							isRunning && "bg-blue-100 text-blue-600",
							runSuccess === true && "bg-green-100 text-green-600",
							runSuccess === false && "bg-red-100 text-red-600",
						)}
						onClick={handleRun}
						disabled={isRunning}
					>
						{isRunning ? (
							<span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
						) : runSuccess === true ? (
							<Check className="h-4 w-4 text-green-600" />
						) : runSuccess === false ? (
							<X className="h-4 w-4 text-red-600" />
						) : (
							<Play className="h-4 w-4" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 relative"
						onClick={handleSave}
						disabled={isSaving}
					>
						{isSaving ? (
							<span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
						) : saveSuccess ? (
							<Check className="h-4 w-4 text-green-600" />
						) : (
							<Save className="h-4 w-4" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => {
							// setNodes((nodes) => nodes.filter((node) => node.id !== id));
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
			{/* 타입 정의 표시 (TypeScript 노드에서만 표시) */}
			{!isNodeMinimized && data.fileExtension === "ts" && showTypeDefinition && (
				<div className="p-3 bg-gray-50 border-b text-xs font-mono">
				<div className="mb-2">
					<Badge variant="outline" className="mb-1">
					Request Type
					</Badge>
					<pre className="bg-gray-100 p-2 rounded overflow-auto">
					{renderTypeDefinition(requestType)}
					</pre>
				</div>
				<div>
					<Badge variant="outline" className="mb-1">
					Response Type
					</Badge>
					<pre className="bg-gray-100 p-2 rounded overflow-auto">
					{renderTypeDefinition(responseType)}
					</pre>
				</div>
				</div>
			)}
			 {!isNodeMinimized && (
				<ParameterForm 
				isParameterSectionCollapsed={isParameterSectionCollapsed}
				setIsParameterSectionCollapsed={setIsParameterSectionCollapsed}
				parent_parameters={[]}>
				</ParameterForm>
			 )}
			{/* 입력 핸들 */}
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: "#555", width: 8, height: 8 }}
			/>
			<Handle
				type="target"
				position={Position.Right}
				style={{ background: "#555", width: 8, height: 8 }}
			/>
		</div>
	);
}

export default memo(FileNode);
