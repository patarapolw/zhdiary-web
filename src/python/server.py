from flask import Flask, render_template, redirect, session
from flask_cors import CORS
import os

from .config import Config
from .ext import mongo, oauth, auth0
from .auth import api_auth

from .api.editor import api_editor
from .api.io import api_io
from .api.quiz import api_quiz
from .api.util import api_util


app = Flask(
    __name__,
    static_folder=str(Config.ROOT.joinpath("public")), static_url_path="",
    template_folder=str(Config.ROOT.joinpath("public"))
)
app.config.from_object(Config)

CORS(app, resources={"/api/*": {"origins": "*"}})

app.register_blueprint(api_auth)
app.register_blueprint(api_editor)
app.register_blueprint(api_io)
app.register_blueprint(api_quiz)
app.register_blueprint(api_util)

mongo.init_app(app)
oauth.init_app(app)


@app.route("/")
def r_index():
    if os.getenv("DEV_SERVER_PORT"):
        return redirect("http://localhost:" + os.getenv("DEV_SERVER_PORT"))

    return render_template("index.html")


@app.route("/callback")
def r_auth_callback():
    auth0.authorize_access_token()
    resp = auth0.get('userinfo')
    user_info = resp.json()

    session['jwt_payload'] = user_info
    session['profile'] = {
        'picture': user_info['picture'],
        "email": user_info["email"]
    }

    return redirect('/')
