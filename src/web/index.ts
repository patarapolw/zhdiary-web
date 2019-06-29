import Vue from "vue";
import VueRouter from "vue-router";
import "./index.scss";
import BootstrapVue from "bootstrap-vue";
import "bootstrap";
import $ from "jquery";
import { slowClick } from "./util";
import h from "hyperscript";
import QuizUi from "./quiz/QuizUi";
import "./contextmenu";
import EditorUi from "./editor/EditorUi";
import LessonUi from "./lesson/LessonUi";
import HanziUi from "./reference/HanziUi";
import VocabUi from "./reference/VocabUi";
import ThousandUi from "./reference/ThousandUi";
import ClipboardUi from "./reference/ClipboardUi";

$(() => {
    $(document.body).on("mousedown", "button", (evt) => {
        const $this = $(evt.target);
        $this.prop("disabled", true);
        slowClick($this);
    })
});


Vue.use(VueRouter);
Vue.use(BootstrapVue);

const router = new VueRouter({
    routes: [
        { path: "/", component: QuizUi },
        { path: "/quiz", component: QuizUi },
        { path: "/editor", component: EditorUi },
        { path: "/lesson", component: LessonUi },
        { path: "/ref/hanzi", component: HanziUi },
        { path: "/ref/vocab", component: VocabUi },
        { path: "/ref/1000", component: ThousandUi },
        { path: "/ref/clipboard", component: ClipboardUi }
    ]
});

const app = new Vue({
    router,
    template: h(".row.stretched", [
        h("b-nav.nav-left", { attrs: { "vertical": "" } }, [
            h("b-nav-item", { attrs: { to: "/quiz" } }, [
                h("i.far.fa-question-circle.nav-icon", {
                    attrs: {
                        "v-b-tooltip.hover": "",
                        title: "Quiz"
                    }
                })
            ]),
            h("b-nav-item", { attrs: { to: "/editor" } }, [
                h("i.far.fa-edit.nav-icon", {
                    attrs: {
                        "v-b-tooltip.hover": "",
                        title: "Editor"
                    }
                }),
            ]),
            h("b-nav-item", { attrs: { to: "/lesson" } }, [
                h("i.fas.fa-school.nav-icon", {
                    attrs: {
                        style: "transform: scale(0.8); margin-left: -0.1em;",
                        "v-b-tooltip.hover": "",
                        title: "Lessons"
                    }
                })
            ]),
            h("b-nav-item-dropdown", {
                attrs: {
                    "no-caret": "",
                    "dropright": ""
                }
            }, [
                    h("template", {
                        attrs: { slot: "button-content" },
                        innerHTML: h("i.fas.fa-journal-whills.nav-icon", {
                            attrs: {
                                style: "margin-left: 0.1em",
                                "v-b-tooltip.hover": "",
                                title: "References"
                            }
                        }).outerHTML
                    }),
                    h("b-dropdown-item", { attrs: { to: "/ref/hanzi" } }, "Hanzi"),
                    h("b-dropdown-item", { attrs: { to: "/ref/vocab" } }, "Vocab"),
                    h("b-dropdown-divider"),
                    h("b-dropdown-item", { attrs: { to: "/ref/1000" } }, "千字文"),
                    h("b-dropdown-divider"),
                    h("b-dropdown-item", { attrs: { to: "/ref/clipboard" } }, "Clipboard parser")
                ]),
            h("b-nav-item", { attrs: { href: "https://github.com/patarapolw/zhdiary-web", target: "_blank" } }, [
                h("i.fab.fa-github.nav-icon", {
                    attrs: {
                        "v-b-tooltip.hover": "",
                        title: "GitHub"
                    }
                })
            ]),
            h("b-nav-item", { 
                style: {"margin-top": "auto"},
                attrs: {
                    "v-on:click": "profile ? (profile.picture ? logout() : undefined) : login()"
                }
            }, [
                h("i.fas.fa-user.nav-icon", {attrs: {
                    "v-if": "!profile",
                    "v-b-tooltip.hover": "",
                    title: "Click here to Login"
                }}),
                h(".nav-icon", {attrs: {
                    "v-else-if": "profile && profile.picture",
                    "v-b-tooltip.hover": "",
                    "title": "Click here to Logout"
                }}, [
                    h("img", {attrs: {
                        ":src": "profile.picture"
                    }})
                ]),
                h("i.fas.fa-user-lock.nav-icon", {attrs: {
                    "v-else": "",
                    "v-b-tooltip.hover": "",
                    ":title": "profile.email",
                    "style": "margin-left: -0.1em;"
                }})
            ]),
        ]),
        h(".separate-vertical"),
        h(".body", { style: { overflow: "scroll" } }, [
            h("router-view")
        ])
    ]).outerHTML,
    data() {
        return {
            profile: null as any
        };
    },
    async created() {
        try {
            this.profile = await (await fetch("/api/auth/profile")).json();
        } catch (e) {
            this.profile = null;
        }
    },
    methods: {
        login() { 
            location.href = "/api/auth/login";
         },
        logout() {
            location.href = "/api/auth/logout";
        }
    }
}).$mount("#App");
