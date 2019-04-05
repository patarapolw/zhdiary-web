import { Vue, Component, Prop, Emit } from "vue-property-decorator";
import { CreateElement } from "vue";
import Quill from "quill";

@Component
export default class VueQuill extends Vue {
    @Prop() private value: string = "";
    @Prop() private required: boolean = false;

    private quill!: Quill;

    public render(m: CreateElement) {
        return m("div", {
            class: ["row"],
            style: {width: "100%"}
        }, [
            m("div", {
                ref: "quillArea",
                class: ["vue-quill", "row"],
                style: {width: "100%", height: "200px"}
            }),
            m("textarea", {
                class: "h-0",
                domProps: {required: this.required, value: this.value}
            })
        ]);
    }

    public mounted() {
        this.quill = new Quill(this.$refs.quillArea as HTMLDivElement, {
            theme: "snow"
        });
        this.quill.on("text-change", () => {
            this.onInput(this.getValue());
        });
    }

    public getValue() {
        return this.quill.root.innerHTML;
    }

    public setValue(v: string) {
        this.quill.setContents([] as any);
        this.quill.clipboard.dangerouslyPasteHTML(v);
    }

    @Emit("input")
    public onInput(v: string) {
        return v;
    }
}
