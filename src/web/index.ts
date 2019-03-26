import "./common";
import $ from "jquery";
import initDeckViewer from "./deckViewer";
import initCardEditor, { destroyCardEditor } from "./cardEditor";
import { fetchJSON } from "./util";
import "./common.css";

$(() => {
    $("#link-deckViewer").on("click", () => {
        destroyCardEditor();
        initDeckViewer();
    });

    $("#link-cardEditor").on("click", () => {
        initCardEditor();
    });
});

const el = {
    searchBarArea: document.getElementById("SearchBarArea") as HTMLDivElement,
    userNameArea: document.getElementById("UserNameArea") as HTMLDivElement,
    loginButton: document.getElementById("LoginButton") as HTMLButtonElement,
    editLink: document.getElementById("link-cardEditor") as HTMLButtonElement,
    quizLink: document.getElementById("link-deckViewer") as HTMLButtonElement,
    app: document.getElementById("App") as HTMLDivElement
};

const displayName: string | undefined = (window as any).displayName;

if (displayName) {
    allowLogout();
} else {
    allowLogin();
}

el.quizLink.onclick = () => initDeckViewer();
el.editLink.onclick = () => initCardEditor();

function allowLogin() {
    el.userNameArea.innerText = displayName || "";
    el.loginButton.classList.add("btn-outline-success");
    el.loginButton.onclick = () => location.replace("/login");
    el.loginButton.innerText = "Login for more";

    el.editLink.disabled = true;
    el.quizLink.disabled = true;

    el.app.innerHTML = `
    <div class="row mt-3 content">
        <div class="col-12">
            Login to create your interactive quiz.
            <img class="mt-3" src="/img/quiz.png" />
            <img class="mt-3" src="/img/editor.png" />
            <br/><br/>
        </div>
    </div>`;
}

function allowLogout() {
    el.loginButton.classList.add("btn-outline-danger");
    el.loginButton.onclick = () => location.replace("/logout");
    el.loginButton.innerText = "Logout";

    el.editLink.disabled = false;
    el.quizLink.disabled = false;

    fetchJSON("/deck/filter").then((r: string[]) => {
        if (r.length > 0) {
            initDeckViewer();
        } else {
            initCardEditor();
        }
    });
}
