import { CreateElement } from "vue";
import h from "hyperscript";
import { fetchJSON, shuffle, md2html } from "../util";
import { Vue, Component } from "vue-property-decorator";
import quizState from "./shared";
import globalState from "../shared";
import EntryEditor from "../DbEditor/entry/EntryEditor";

@Component
export default class QuizArea extends Vue {
    private state = {
        quiz: quizState
    };

    private currentId?: number;

    public render(m: CreateElement) {
        return m("div", {
            style: {
                display: this.state.quiz.isQuizReady ? "inline-block" : "none",
                height: `${window.innerHeight - 60}px`, overflow: "scroll"
            },
            class: {
                "col-12": this.state.quiz.isDeckHidden,
                "col-9": !this.state.quiz.isDeckHidden,
                "fixed-container": true,
                "quiz-area": true
            }
        }, [
            m(EntryEditor, {
                ref: "entryEditor",
                props: {
                    title: "Edit entry",
                    cols: globalState.cols,
                    showAll: true,
                    editorApi: globalState.cardEditorApi
                },
                on: {save: this.onEntryUpdated}
            }),
            m("div", {
                class: ["quiz-area"]
            }, this.state.quiz.currentDeck)
        ]);
    }

    public updated() {
        if (this.state.quiz.currentDeck) {
            this.initQuiz();
        }
    }

    private async initQuiz() {
        const quizAreaEl = this.$el;
        const $quizArea = $(".quiz-area", quizAreaEl);

        $quizArea.html("");
        const cardIds = await fetchJSON(globalState.quizApi, {deck: quizState.currentDeck, q: quizState.q});

        $quizArea.html(h("div", `${cardIds.length} entries to go...`).outerHTML);
        if (cardIds.length > 0) {
            shuffle(cardIds);

            while (cardIds.length > 0) {
                const cardId = cardIds.splice(0, 1)[0];
                const c = await fetchJSON(globalState.quizApi + "render", {id: cardId});

                const $parent = $(h(`.c-container.c-${cardId}`, [
                    h(".c-all.c-data-front", {innerHTML: md2html(c.front)}),
                    h(".c-back.c-data-back", {innerHTML: md2html(c.back)}),
                    h(".c-btn-list.mt-3.mb-3", [
                        h("button.btn.btn-primary.c-front.c-btn-show", "Show"),
                        h("button.btn.btn-success.c-back.c-btn-right.mr-1", "Right"),
                        h("button.btn.btn-danger.c-back.c-btn-wrong.mr-1", "Wrong"),
                        h("button.btn.btn-info.c-back.c-btn-edit.mr-1", "Edit entry"),
                        h("button.btn.btn-warning.c-back.c-btn-skip", "Skip")
                    ])
                ]).outerHTML);

                $parent.data("id", cardId);
                $quizArea.append($parent);
                quizAreaEl.scrollTo(0, quizAreaEl.scrollHeight);

                $(".c-back", $parent).hide();
                $(".c-btn-show", $parent).click(() => {
                    $(".c-front", $parent).hide();
                    $(".c-back", $parent).show();
                    quizAreaEl.scrollTo(0, quizAreaEl.scrollHeight);
                });

                $(".c-btn-edit", $parent).click(() => {
                    this.currentId = cardId;
                    (this.$refs.entryEditor as any).show(cardId);
                });

                await new Promise((resolve, reject) => {
                    $(".c-btn-right", $parent).click(() => {
                        fetchJSON("/quiz/right", {id: cardId}, "PUT");
                        resolve();
                    });

                    $(".c-btn-wrong", $parent).click(() => {
                        fetchJSON("/quiz/wrong", {id: cardId}, "PUT");
                        resolve();
                    });

                    $(".c-btn-skip", $parent).click(() => {
                        resolve();
                    });
                });

                $(".c-btn-list", $parent).hide();
            }

            $quizArea.append(h("div", "All done!").outerHTML);
        } else {
            const [nextHour, nextDay] = await Promise.all([
                fetchJSON("/quiz/", {
                    deck: quizState.currentDeck,
                    q: quizState.q,
                    due: [1, "hour"]
                }),
                fetchJSON("/quiz/", {
                    deck: quizState.currentDeck,
                    q: quizState.q,
                    due: [1, "day"]
                })
            ]);

            $quizArea.append(h("div", [
                h("div", `Pending next hour: ${nextHour.length}`),
                h("div", `Pending next day: ${nextDay.length}`)
            ]));
        }
    }

    private async onEntryUpdated(entry: any) {
        await fetchJSON(globalState.cardEditorApi, {id: this.currentId, update: entry}, "PUT");
        const $parent = $(`.c-${this.currentId}`);

        $(".c-data-front", $parent).html(md2html(entry.front));
        $(".c-data-back", $parent).html(md2html(entry.back));
    }
}
