import DbEditor from "./dbEditor/dbEditor";
import $ from "jquery";

export function initCardEditor() {
    const $app = $("#App");
    $app.html("").removeClass("container");

    const editor = new DbEditor({
        el: $app[0],
        endpoint: "/editor/card/",
        templateApi: "/template/",
        columns: [
            {name: "deck", width: 200, type: "one-line", required: true},
            {name: "template", width: 150, type: "one-line"},
            {name: "front", width: 500, type: "html", required: true},
            {name: "back", width: 500, type: "html"},
            {name: "tag", width: 150, type: "list", separator: " "},
            {name: "note", width: 300, type: "html"},
            {name: "srsLevel", width: 150, type: "number", label: "SRS Level", newEntry: false},
            {name: "nextReview", width: 200, type: "datetime", label: "Next Review", newEntry: false}
        ]
    });
}

export function destroyCardEditor() {
    $(".db-editor-nav").remove();
}

export default initCardEditor;
