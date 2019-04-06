import Vue from "vue";
import VueRouter from "vue-router";
import Counter from "./DbEditor/component/Counter";
import SearchBar from "./DbEditor/component/SearchBar";
import "./index.scss";
import Quiz from "./Quiz/Quiz";
import BootstrapVue from "bootstrap-vue";
import "bootstrap";
import CardEditor from "./DbEditor/CardEditor";
import { fetchJSON } from "./util";
import Front from "./Front";

Vue.use(VueRouter);
Vue.use(BootstrapVue);

const router = new VueRouter({
    routes: [
        {name: "default", path: "/", component: Front},
        {name: "quiz", path: "/quiz", component: Quiz},
        {name: "cardEditor", path: "/edit", component: CardEditor}
    ]
});

const app = new Vue({
    data: {
        displayName: null as any
    },
    router,
    render(m) {
        return m("div", {
            class: ["h-100"]
        }, [
            m("nav", {
                class: ["navbar", "navbar-expand-lg", "navbar-light", "bg-light"]
            }, [
                m("a", {
                    class: ["navbar-brand"],
                    domProps: {href: "#"}
                }, "中文 Diary"),
                m("button", {
                    class: ["navbar-toggler"],
                    attrs: {"data-target": "#navbarSupportedContent", "data-toggle": "collapse", "aria-expanded": false},
                    domProps: {type: "button"}
                }, [
                    m("span", {
                        class: ["navbar-toggler-icon"]
                    })
                ]),
                m("div", {
                    class: ["collapse", "navbar-collapse"],
                    attrs: {id: "navbarSupportedContent"}
                }, [
                    m("ul", {
                        class: ["navbar-nav", "mr-auto"]
                    }, [
                        m("li", {
                            class: {
                                "active": this.$route.path === "/quiz",
                                "nav-item": true
                            }
                        }, [
                            m("router-link", {
                                class: {
                                    "nav-link": true,
                                    "disabled": !this.displayName
                                },
                                props: {
                                    to: "/quiz",
                                    disabled: !this.displayName
                                }
                            }, "Quiz")
                        ]),
                        m("li", {
                            class: {
                                "active": this.$route.path === "/edit",
                                "nav-item": true
                            }
                        }, [
                            m("router-link", {
                                class: {
                                    "nav-link": true,
                                    "disabled": !this.displayName
                                },
                                props: {
                                    to: "/edit",
                                    disabled: !this.displayName
                                }
                            }, "Edit")
                        ]),
                        m("li", {
                            class: ["nav-item"]
                        }, [
                            m("a", {
                                class: ["nav-link"],
                                domProps: {href: "https://github.com/patarapolw/zhdiary-web", target: "_blank"}
                            }, "About")
                        ]),
                        m(Counter)
                    ]),
                    m("ul", {
                        class: ["navbar-nav"]
                    }, [
                        m(SearchBar, {
                            class: ["nav-item", "mt-1"]
                        }),
                        m("button", {
                            class: {
                                "btn": true,
                                "form-control": true,
                                "nav-item": true,
                                "mt-1": true,
                                "mr-2": true,
                                "btn-outline-danger": !!this.displayName,
                                "btn-outline-success": !this.displayName
                            },
                            on: {click: () => location.replace(this.displayName ? "/logout" : "/login")}
                        }, this.displayName ? "Logout" : "Login")
                    ])
                ])
            ]),
            m("router-view")
        ]);
    },
    methods: {
        async getLoginStatus() {
            const r = (await fetchJSON("/loginStatus"));
            if (typeof r === "object") {
                this.displayName = r.displayName;
                if (this.$route.path === "/") {
                    router.push("/quiz");
                }
            } else {
                this.displayName = null;
                router.push("/");
            }
        }
    },
    created() {
        // @ts-ignore
        this.getLoginStatus();
    },
    beforeUpdate() {
        // @ts-ignore
        this.getLoginStatus();
    }
}).$mount("#App");
