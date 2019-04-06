import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { CreateElement } from "vue";
import EntryEditor from "./entry/EntryEditor";
import CellEditorHtml from "./cell/CellEditorHtml";
import CellEditorText from "./cell/CellEditorText";
import CellEditorList from "./cell/CellEditorList";
import DbEditorTr from "./DbEditorTr";
import { fetchJSON } from "../util";
import $ from "jquery";
import { resizableGrid } from "./plugin/tableResize";
import { IColumn } from ".";
import dbEditorState from "./shared";

@Component
export default class DbEditor extends Vue {
    @Prop() private cols!: IColumn[];
    @Prop() private sortBy!: string;
    @Prop() private editorApi!: string;

    private desc: boolean = false;
    private data: any[] = [];
    private offset = 0;
    private limit = 10;
    private q = "";

    private counter = dbEditorState.counter;
    private searchBar = dbEditorState.searchBar;

    constructor(props: any) {
        super(props);
        $(document.body).on("click", () => {
            if ($(".cell-editor-text.can-remove:not(:hover)").length > 0) {
                (this.$refs.editorText as any).hide();
            }
        });
        this.counter.isActive = true;
        this.counter.page.offset = 0;
        this.counter.canAddEntry = true;
        this.searchBar.isActive = true;
        this.searchBar.q = "";
    }

    public render(m: CreateElement) {
        return m("div", {
            style: {"overflow-x": "scroll"}
        }, [
            m(EntryEditor, {
                ref: "entryEditor",
                props: {
                    title: "Add new entry",
                    cols: this.cols,
                    editorApi: this.editorApi
                },
                on: {save: this.addEntry}
            }),
            m(CellEditorText, {ref: "editorText", on: {hide: this.updateCell}}),
            m(CellEditorList, {on: {save: this.updateCell}}),
            m(CellEditorHtml, {on: {save: this.updateCell}}),
            m("table", {
                class: ["table", "table-striped"]
            }, [
                m("thead", [
                    m("tr", [
                        ...this.cols.map((col) => {
                            return m("th", {
                                attrs: {scope: "col"},
                                style: {width: `${col.width}px`},
                                on: {click: () => {
                                    if (this.sortBy === col.name) {
                                        this.desc = !this.desc;
                                    } else {
                                        this.sortBy = col.name;
                                        this.desc = false;
                                    }
                                    this.fetchData();
                                }}
                            }, `${col.name} ${this.sortBy === col.name
                                ? this.desc ? "▲" : "▼" : ""}`);
                        }),
                        m("th", {
                            attrs: {scope: "col"},
                            style: {width: "50px !important"}
                        })
                    ])
                ]),
                m("tbody", this.data.map((d) => m(DbEditorTr, {
                    ref: `row${d.id}`,
                    props: {data: d, editorApi: this.editorApi},
                    on: {remove: this.removeEntry}
                })))
            ])
        ]);
    }

    public mounted() {
        const $table = $("table");
        resizableGrid($table[0]);
        this.fetchData();
    }

    @Watch("counter.page.offset")
    public watchOffset(offset: number) {
        this.offset = offset;
        this.fetchData();
    }

    @Watch("counter.addEntry")
    public watchAddEntry(clicked: boolean) {
        if (clicked) {
            (this.$refs.entryEditor as any).show();
        }
    }

    @Watch("searchbar.q")
    public watchQ(q: string) {
        this.q = q;
        this.fetchData();
    }

    public beforeUpdate() {
        if (this.data.length === 0) {
            this.fetchData();
        }
    }

    public updated() {
        resizableGrid($("table")[0]);
    }

    private async fetchData() {
        const r = await fetchJSON(this.editorApi, {q: this.q, offset: this.offset, limit: this.limit,
            sortBy: this.sortBy, desc: this.desc});
        this.data = r.data;
        this.counter.page.count = r.total;
    }

    private async updateCell({id, colName, value}: any) {
        if (id) {
            const r = await fetchJSON(this.editorApi, {id, fieldName: colName, fieldData: value}, "PUT");

            if (r === 201) {
                this.data.forEach((d, i) => {
                    if (d.id === id) {
                        this.data[i][colName] = value;
                    }
                });
            }
        }
    }

    private async addEntry(entry: any) {
        const r = await fetchJSON(this.editorApi, {create: entry}, "PUT");
        entry.id = r.id;

        dbEditorState.counter.page.count++;
        this.data.splice(0, 0, entry);

        if (this.data.length > 10) {
            this.data = this.data.slice(0, 10);
        }
    }

    private async removeEntry(id: number) {
        const r = await fetchJSON(this.editorApi, {id}, "DELETE");

        this.data.forEach((d, i) => {
            if (d.id === id) {
                this.data.splice(i, 1);
            }
        });
    }
}
