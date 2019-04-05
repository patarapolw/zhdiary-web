import { Vue, Component } from "vue-property-decorator";
import { CreateElement } from "vue";
import dbEditorState from "./DbEditor/shared";

@Component
export default class Front extends Vue {
    public render(m: CreateElement) {
        return m("div", {
            class: ["mt-3", "container", "nav-fixed-content"]
        }, [
            m("div", {class: ["row"]}, "Login to create your interactive quiz."),
            m("img", {
                class: ["mt-3", "row", "mx-auto"],
                domProps: {src: "/img/quiz.png"}
            }),
            m("img", {
                class: ["mt-3", "row", "mx-auto"],
                domProps: {src: "/img/editor.png"}
            })
        ]);
    }

    public beforeCreate() {
        dbEditorState.counter.isActive = false;
        dbEditorState.searchBar.isActive = false;
    }
}
