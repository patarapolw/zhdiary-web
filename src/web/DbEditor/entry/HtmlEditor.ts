import { Vue, Component, Prop, Emit } from "vue-property-decorator";
import { CreateElement } from "vue";
import Quill from "quill";
// @ts-ignore
import { Editor, EditorContent } from "tiptap";

@Component
export default class VueQuill extends Vue {
    @Prop() private value: string = "";
    @Prop() private required: boolean = false;

    private quill!: Quill;
    private _value = "";

    public render(m: CreateElement) {
        this._value = this._value || this.value;

        return m("div", {
            class: ["row", "mx-auto"],
            style: {width: "100%"}
        }, [
            m("div", {
                ref: "quillArea",
                class: ["vue-quill"],
                style: {width: "100%"}
            }),
            m("textarea", {
                class: "h-0",
                domProps: {"required": this.required, "value": this._value, "tab-index": -1}
            })
        ]);
    }

    public mounted() {
        this.quill = new Quill(this.$refs.quillArea as HTMLDivElement, {
            theme: "snow"
        });
        this.quill.on("text-change", (delta, oldDelta, source) => {
            if (source !== "api") {
                this._value = this.getValue();
                this.onInput(this._value);
            }
        });
    }

    public getValue() {
        return this.quill.root.innerHTML;
    }

    public setValue(v: string) {
        this.quill.setContents([] as any);
        this.quill.clipboard.dangerouslyPasteHTML(v || "", "api");
    }

    @Emit("input")
    public onInput(v: string) {
        return v;
    }
}
