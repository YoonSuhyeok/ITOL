interface NodeType<T = any> {
    id: string;
    type: string;
    fk_page_id: number;
    position: {
        x: number;
        y: number;
    }
    data: T;
};

export default NodeType;