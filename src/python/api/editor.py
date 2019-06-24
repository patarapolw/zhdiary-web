from flask import Blueprint, request, jsonify, Response

from ..auth import auth
from src.python.engine.db import Db

api_editor = Blueprint('editor', __name__, url_prefix="/api/editor")


@api_editor.route("/", methods=["POST", "PUT", "DELETE"])
@auth.login_required
def r_editor():
    r = request.json

    if request.method == "POST":
        return jsonify(Db.parse_cond(r.get("cond"), r["offset"], r["limit"]))

    elif request.method == "PUT":
        if r.get("create"):
            if isinstance(r["create"], list):
                c_ids = Db.insert_many(r["create"])
                return jsonify({
                    "ids": c_ids
                })
            else:
                c_id = Db.insert_many([r["create"]])[0]
                return jsonify({
                    "id": c_id
                })

        if r.get("update"):
            if r.get("ids"):
                Db.update_many(r["ids"], r["update"])
            else:
                Db.update_many([r["id"]], r["update"])

        return jsonify({"error": None})

    elif request.method == "DELETE":
        if r.get("ids"):
            Db.delete_many(r["ids"])
        else:
            Db.delete_many([r["id"]])

        return jsonify({"error": None})

    return Response(status=404)


@api_editor.route("/editTags", methods=["PUT", "DELETE"])
@auth.login_required
def r_editor_edit_tags():
    d = request.json
    if request.method == "DELETE":
        Db.remove_tags(d["ids"], d["tags"])
    else:
        Db.add_tags(d["ids"], d["tags"])

    return jsonify({"error": None})
