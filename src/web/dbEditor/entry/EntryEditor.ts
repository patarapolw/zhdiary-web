import { toTitle, fetchJSON } from "../../util";
import { Vue, Component, Prop, Emit } from "vue-property-decorator";
import { CreateElement } from "vue";
import $ from "jquery";
import { IColumn } from "..";
import globalState from "../../shared";
import EEOneLine from "./EEOneLine";
import EETag from "./EETag";
import EEDatetime from "./EEDatetime";
import VueQuill from "./HtmlEditor";

@Component
export default class EntryEditor extends Vue {
    @Prop() private title: string = "Edit entry";
    @Prop() private showAll = false;
    @Prop() private cols!: IColumn[];
    @Prop() private editorApi!: string;

    private entry: any = {};
    private wasValidated = false;

    private oldEntry: any = {};

    constructor(props: any) {
        super(props);
        $(document.body).on("mouseover", ".modal", () => {
            const $modal = $(".modal");
            if ($("textarea:hover, .ql-editor:hover", $modal).length > 0) {
                $modal.css("pointer-events", "none");
            } else {
                $modal.css("pointer-events", "auto");
            }
        });
    }

    public render(m: CreateElement) {
        const formContent: any[] = [];

        for (const col of this.cols) {
            if (!this.showAll && typeof col.newEntry === "boolean" && !col.newEntry) {
                continue;
            }

            switch (col.type) {
                case "one-line":
                case "number":
                case "list":
                    if (col.name === "template") {
                        formContent.push(m(EEOneLine, {
                            ref: "template",
                            props: {col, value: this.entry[col.name] || ""},
                            on: {input: (_v: string) => {
                                Vue.set(this.entry, col.name, _v);
                                if (_v) {
                                    fetchJSON(globalState.templateApi, {template: _v}).then((t) => {
                                        if (t) {
                                            for (const col2 of this.cols) {
                                                if (t[col2.name]) {
                                                    this.entry = Object.assign(this.entry, {
                                                        [col2.name]: t[col2.name]
                                                    });
                                                    (this.$refs[`quill-${col2.name}`] as any).setValue(t[col2.name]);
                                                }
                                            }
                                        }
                                    });
                                }
                            }}
                        }));
                    } else if (col.name === "tag") {
                        formContent.push(m(EETag, {
                            props: {col, value: this.entry[col.name] || ""},
                            on: {input: (_v: string) => Vue.set(this.entry, col.name, _v)}
                        }));
                    } else {
                        formContent.push(m(EEOneLine, {
                            props: {col, value: this.entry[col.name] || ""},
                            on: {input: (_v: string) => Vue.set(this.entry, col.name, _v)}
                        }));
                    }
                    break;
                case "datetime":
                    formContent.push(m(EEDatetime, {
                        props: {col, value: this.entry[col.name] || ""},
                        on: {input: (_v: string) => Vue.set(this.entry, col.name, _v)}
                    }));
                    break;
                case "html":
                    formContent.push(m("div", {
                        class: ["form-group"]
                    }, [
                        m("label", col.label || toTitle(col.name)),
                        m(VueQuill, {
                            ref: `quill-${col.name}`,
                            props: {
                                value: this.entry[col.name] || "",
                                required: col.required
                            },
                            on: {input: (_v: string) => Vue.set(this.entry, col.name, _v)}
                        }),
                        col.required
                        ? m("div", {
                            class: ["invalid-feedback"]
                        }, `${toTitle(col.name)} is required.`)
                        : undefined
                    ]));
            }
        }

        return m("b-modal", {
            ref: "entryEditor",
            props: {size: "lg"},
            attrs: {"title": this.title, "hide-footer": true}
        }, [
            m("form", {
                class: {
                    "was-validated": this.wasValidated,
                    "ml-3": true,
                    "mr-3": true,
                    "needs-validation": true
                }
            }, formContent),
            m("b-button", {
                on: {click: () => {
                    for (const col of this.cols) {
                        if (col.required) {
                            if (!this.entry[col.name]) {
                                this.wasValidated = true;
                                return;
                            }
                        }
                    }

                    const entry = {} as any;
                    for (const col of this.cols) {
                        let v = this.entry[col.name];
                        if (v && col.type === "list") {
                            v = v.filter((el: string, i: number) => el && v.indexOf(el) === i).sort();
                        } else if (v && col.type === "number") {
                            v = parseFloat(v);
                        }

                        entry[col.name] = v;
                    }

                    this.onSave(entry);
                    (this.$refs.entryEditor as any).hide();
                }}
            }, "Save")
        ]);
    }

    public async show(id?: number) {
        this.wasValidated = false;
        if (id) {
            const r = await fetchJSON(this.editorApi, {q: `id:${id}`, offset: 0, limit: 1});
            this.entry = r.data[0];
        } else {
            this.entry = {};
        }
        (this.$refs.entryEditor as any).show();
    }

    public updated() {
        if (this.entry !== this.oldEntry) {
            this.oldEntry = this.entry;
            for (const col of this.cols) {
                if (col.type === "html") {
                    (this.$refs[`quill-${col.name}`] as any).setValue(this.entry[col.name]);
                }
            }
        }
    }

    @Emit("save")
    public onSave(entry: any) {
        return entry;
    }
}
