import { IColumn } from "./DbEditor";

export const globalState = {
    deckApi: "/deck/",
    quizApi: "/quiz/",
    templateApi: "/template/",
    cardEditorApi: "/card/editor/",
    cols: [
        {name: "deck", width: 150, type: "one-line", required: true},
        {name: "template", width: 150, type: "one-line"},
        {name: "front", width: 400, type: "html", required: true},
        {name: "back", width: 400, type: "html"},
        {name: "tag", width: 150, type: "list", separator: " "},
        {name: "note", width: 300, type: "html"},
        {name: "srsLevel", width: 150, type: "number", label: "SRS Level", newEntry: false},
        {name: "nextReview", width: 220, type: "datetime", label: "Next Review", newEntry: false}
    ] as IColumn[],
    entryEditor: {} as any
};

export default globalState;
