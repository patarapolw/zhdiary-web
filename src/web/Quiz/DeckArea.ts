import { CreateElement } from "vue";
import { fetchJSON } from "../util";
import uuid from "uuid/v4";
import h from "hyperscript";
import { Vue, Component, Watch } from "vue-property-decorator";
import $ from "jquery";
import "jstree";
import "jstree/dist/themes/default/style.min.css";
import quizState from "./shared";
import globalState from "../shared";
import dbEditorState from "../DbEditor/shared";

@Component
export default class DeckArea extends Vue {
    private $dom?: JQuery;
    private jstree?: any;
    private uuidToDeck: any = {};

    private state = quizState;

    private previousDeckList: string[] = [];

    constructor(props: any) {
        super(props);
        dbEditorState.counter.isActive = false;
        dbEditorState.searchBar.isActive = false;

        this.state.mediaQuery.addListener(this.readMq);
    }

    public render(m: CreateElement) {
        return m("div", {
            class: {
                "col-3": this.state.isQuizShown,
                "border-right": this.state.isQuizShown,
                "col-12": !this.state.isQuizShown,
                "animate": true,
                "fixed-container": true
            },
            style: {
                display: this.state.isDeckHidden ? "none" : "inline-block",
                height: `${window.innerHeight - 60}px`, overflow: "scroll"
            }
        }, [
            m("input", {
                class: ["form-control", "mt-3", "search-bar"],
                domProps: {placeholder: "Type here to search"},
                on: {input: (e: any) => this.state.q = e.target.value}
            }),
            m("div", {
                class: ["col-12"],
                attrs: {id: "deck-area"}
            })
        ]);
    }

    @Watch("state.q")
    public watchQ() {
        this.loadJstree();
    }

    public mounted() {
        this.$dom = $("#deck-area", this.$el);
        this.loadJstree();
    }

    private async loadJstree() {
        let deckList: string[] = await fetchJSON(globalState.deckApi + "filter", {q: quizState.q});

        deckList = deckList.sort();

        if (deckList.length === 0 || deckList.every((d, i) => {
            return this.previousDeckList[i] === d;
        })) {
            return;
        }

        this.previousDeckList = deckList;

        if (this.jstree) {
            this.uuidToDeck = {};
            this.jstree.destroy();
            this.jstree = null;
        }

        const deckWithSubDecks: string[] = [];

        deckList.forEach((d: string) => {
            const deck = d.split("/");
            deck.forEach((seg, i) => {
                const subDeck = deck.slice(0, i + 1).join("/");
                if (deckWithSubDecks.indexOf(subDeck) === -1) {
                    deckWithSubDecks.push(subDeck);
                }
            });
        });

        const data = [] as any[];

        deckWithSubDecks.forEach((d) => {
            const deck = d.split("/");
            this.recurseParseData(data, deck);
        });

        (this.$dom as any).jstree({core: {
            data,
            multiple: false
        }});

        this.jstree = (this.$dom as any).jstree(true);

        this.$dom!
        .bind("loaded.jstree", () => {
            Object.keys(this.uuidToDeck).forEach((id) => {
                const node = this.jstree.get_node(id);
                if (node.children.length === 0) {
                    this.nodeAddStat(id);
                }
            });
        })
        .bind("after_open.jstree", (e: any, current: any) => {
            $(".tree-score", $(`#${current.node.id}`)).remove();
            current.node.children_d.forEach((id: string) => {
                if (!this.jstree.get_node(id).state.opened) {
                    this.nodeAddStat(id);
                }
            });
        })
        .bind("after_close.jstree", (e: any, current: any) => {
            this.nodeAddStat(current.node.id);
        })
        .bind("select_node.jstree", (e: any, current: any) => {
            quizState.isQuizShown = true;
            this.initQuiz(this.uuidToDeck[current.node.id]);
        });
    }

    private recurseParseData(data: any[], deck: string[], _depth = 0) {
        let doLoop = true;

        while (_depth < deck.length - 1) {
            for (const c of data) {
                if (c.text === deck[_depth]) {
                    c.children = c.children || [];
                    this.recurseParseData(c.children, deck, _depth + 1);
                    doLoop = false;
                    break;
                }
            }

            _depth++;

            if (!doLoop) {
                break;
            }
        }

        if (doLoop && _depth === deck.length - 1) {
            const id = uuid();

            data.push({
                id,
                text: deck[_depth],
                state: _depth < 2 ? {opened: true} : undefined
            });

            this.uuidToDeck[id] = deck.join("/");
        }
    }

    private async nodeAddStat(id: string) {
        const stat = await fetchJSON(globalState.deckApi + "stat", {
            deck: this.uuidToDeck[id],
            q: quizState.q
        });

        $(`#${id}`).append(h(".tree-score.float-right.text-align-right", [
            h("span.tree-new.tree-score-child", stat.new),
            h("span.tree-leech.tree-score-child", stat.leech),
            h("span.tree-due.tree-score-child", stat.due)
        ]).outerHTML);
    }

    private initQuiz(deckName: string) {
        setTimeout(() => {
            quizState.isQuizReady = true;
            this.readMq();
        }, 400);

        quizState.currentDeck = deckName;
    }

    private readMq(mq: MediaQueryListEvent | MediaQueryList = quizState.mediaQuery) {
        if (mq.matches && quizState.isQuizShown) {
            this.state.isDeckHidden = true;
        } else {
            this.state.isDeckHidden = false;
        }
    }
}
