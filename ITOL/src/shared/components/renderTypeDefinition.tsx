import ReactJsonView from '@microlink/react-json-view'

function renderTypeDefinition(requestType: undefined): import("react").ReactNode {
    return (
        <ReactJsonView src={{
        string: 'this is a test string',
        integer: 42,
        array: [1, 2, 3, 'test', NaN],
        float: 3.14159,
        undefined: undefined,
        object: {
            'first-child': true,
            'second-child': false,
            'last-child': null
            },
        string_number: '1234',
        date: new Date()
        }} />
    );
}

export default renderTypeDefinition;