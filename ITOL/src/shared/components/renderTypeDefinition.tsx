import ReactJsonView from '@microlink/react-json-view'

function renderTypeDefinition(type: Record<string, any>): import("react").ReactNode {
    return (
        <ReactJsonView src={type} name={false} />
    );
}

export default renderTypeDefinition;