from flask import Blueprint, request, jsonify

from src.python.engine.db import Db
from ..auth import auth

api_quiz = Blueprint("quiz", __name__, url_prefix="/api/quiz")


@api_quiz.route("/", methods=["POST"])
@auth.login_required
def r_quiz_build():
    r = request.json
    return jsonify({"cards": [dict(c) for c in Db.parse_cond(r["cond"], fields=[
        "_id", "entry", "type"
    ])]})


@api_quiz.route("/render", methods=["POST"])
@auth.login_required
def r_quiz_render():
    r = request.json

    if r.get("cardId"):
        return jsonify(Db.render_from_id(card_id=r["cardId"]))
    else:
        return jsonify(Db.render(r["entry"], r["type"]))


@api_quiz.route("/right", methods=["PUT"])
@auth.login_required
def r_quiz_right():
    r = request.json
    Db.mark_right(r.get("id"), r.get("data"))
    return jsonify({"error": None})


@api_quiz.route("/wrong", methods=["PUT"])
@auth.login_required
def r_quiz_wrong():
    r = request.json
    Db.mark_wrong(r.get("id"), r.get("data"))
    return jsonify({"error": None})
