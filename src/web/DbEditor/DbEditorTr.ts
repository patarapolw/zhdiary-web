import { Vue, Component, Prop, Emit } from "vue-property-decorator";
import { CreateElement } from "vue";
import globalState from "../shared";
import dbEditorState from "./shared";
import uuid from "uuid/v4";
import { fetchJSON } from "../util";
import DatetimeNullable from "./entry/DatetimeNullable";

@Component
export default class CardEditorTr extends Vue {
    @Prop() private data!: any;
    @Prop() private editorApi!: any;

    public render(m: CreateElement) {
        const tds = globalState.cols.map((col) => {
            const v = this.data[col.name];
            let inner;
            let onclick = (e: any) => {};
            const tdRef = uuid();

            if (col.type === "datetime") {
                inner = m(DatetimeNullable, {
                    props: {value: this.data[col.name] || ""},
                    style: {width: "220px"},
                    on: {input: (_v: string | null) => {
                        fetchJSON(this.editorApi, {id: this.data.id, fieldName: "nextReview", fieldData: _v}, "PUT")
                        .then(() => {
                            Vue.set(this.data, "nextReview", _v);
                        });
                    }}
                });
            } else if (col.type === "html") {
                inner = m("div", {
                    class: ["cell-wrapper"],
                    domProps: {innerHTML: this.data[col.name] || ""}
                });

                onclick = () => dbEditorState.editor.html.show(this.data.id, col.name, v);
            } else if (col.type === "list") {
                inner = m("div", {
                    class: ["cell-wrapper"]
                }, v ? v.join("\n") : "");

                onclick = () => {
                    dbEditorState.editor.list.show(this.data.id, col.name, v);
                };
            } else {
                inner = m("div", {
                    class: ["cell-wrapper"]
                }, v);

                onclick = () => {
                    const $dom = $(this.$refs[tdRef]);
                    dbEditorState.editor.text.position = {
                        offset: $dom.offset(),
                        height: $dom.height(),
                        width: $dom.width()
                    };

                    dbEditorState.editor.text.show(this.data.id, col.name, v);
                };
            }

            return m("td", {
                ref: tdRef,
                on: {click: onclick}
            }, [
                inner
            ]);
        });

        tds.push(m("td", [
            m("button", {
                class: ["btn"],
                style: {cursor: "pointer"},
                on: {click: () => this.onRemove(this.data.id)}
            }, "✘")
        ]));

        return m("tr", tds);
    }

    @Emit("remove")
    public onRemove(id: number) {
        return id;
    }
}
