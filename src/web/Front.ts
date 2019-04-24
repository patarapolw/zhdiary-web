import { Vue, Component } from "vue-property-decorator";
import { CreateElement } from "vue";
import dbEditorState from "./DbEditor/shared";

@Component
export default class Front extends Vue {
    public render(m: CreateElement) {
        return m("div", {
            class: ["mt-3", "container", "nav-fixed-content"]
        }, [
            m("div", {class: ["row", "ml-3", "mr-3"]}, "Login to create your interactive quiz."),
            m("img", {
                class: ["mt-3", "row", "mx-auto"],
                domProps: {src: "/screenshots/editor.png"}
            }),
            m("img", {
                class: ["mt-3", "row", "mx-auto"],
                domProps: {src: "/screenshots/quiz-sentence.png"}
            }),
            m("img", {
                class: ["mt-3", "row", "mx-auto"],
                domProps: {src: "/screenshots/quiz.png"}
            })
        ]);
    }

    public beforeCreate() {
        dbEditorState.counter.isActive = false;
        dbEditorState.searchBar.isActive = false;
    }
}
