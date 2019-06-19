from flask import Blueprint, request, jsonify

from ..db import Db
from ..auth import auth

api_quiz = Blueprint("quiz", __name__, url_prefix="/api/quiz")


@api_quiz.route("/", methods=["POST"])
@auth.login_required
def r_quiz_build():
    r = request.json
    return jsonify({"ids": [c["card_id"] for c in Db.parse_cond(r["cond"], offset=0, limit=1, fields=["id"])[0]]})


@api_quiz.route("/render", methods=["POST"])
@auth.login_required
def r_quiz_render():
    r = request.json
    return jsonify(Db.render(r["id"]))


@api_quiz.route("/right", methods=["PUT"])
@auth.login_required
def r_quiz_right():
    r = request.json
    Db.mark_right(r["id"])
    return jsonify({"error": None})


@api_quiz.route("/wrong", methods=["PUT"])
@auth.login_required
def r_quiz_wrong():
    r = request.json
    Db.mark_wrong(r["id"])
    return jsonify({"error": None})
