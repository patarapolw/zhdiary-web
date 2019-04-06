import { Vue, Component, Prop, Emit } from "vue-property-decorator";
import { CreateElement } from "vue";
import dbEditorState from "../shared";
import VueQuill from "../entry/HtmlEditor";

@Component
export default class CellEditorHtml extends Vue {
    private id?: number;
    private colName?: string;

    private quill: any;
    private config = dbEditorState.editor.html;

    constructor(props: any) {
        super(props);
        this.config.show = this.show;
    }

    public render(m: CreateElement) {
        return m("b-modal", {
            ref: "cellEditorHtml",
            props: {size: "lg"},
            attrs: {"hide-footer": true, "hide-header": true}
        }, [
            m(VueQuill, {
                ref: "vueQuill",
                class: ["mb-3", "cell-editor-html", "mx-auto"]
            }),
            m("b-button", {
                on: {click: () => this.onSave()}
            }, "Save")
        ]);
    }

    public mounted() {
        this.quill = (this.$refs.vueQuill as any);
    }

    @Emit("save")
    public onSave() {
        (this.$refs.cellEditorHtml as any).hide();

        return {id: this.id, colName: this.colName, value: this.quill.getValue()};
    }

    private show(id: number, colName: string, value: string) {
        this.id = id;
        this.colName = colName;
        this.quill.setValue(value);

        (this.$refs.cellEditorHtml as any).show();
    }
}
