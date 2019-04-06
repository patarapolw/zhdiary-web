import { Vue, Component, Emit } from "vue-property-decorator";
import { CreateElement } from "vue";
import dbEditorState from "../shared";

@Component
export default class SearchBar extends Vue {
    private state = dbEditorState.searchBar;

    public render(m: CreateElement) {
        return m("input", {
            ref: "searchBar",
            class: ["form-control", "mr-sm-2"],
            style: {minWidth: "300px", display: this.state.isActive ? "inline-block" : "none"},
            domProps: {placeholder: "Type here to search", autocomplete: false},
            on: {input: (e: any) => this.onChange(e.target.value)}
        });
    }

    public mounted() {
        this.state.instance = this.$refs.searchBar;
    }

    @Emit("change")
    public onChange(v: string) {
        this.state.q = v;
        return v;
    }
}
