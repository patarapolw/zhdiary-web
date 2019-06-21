from flask import Blueprint, request, jsonify, send_file
from uuid import uuid4
import json

from ..config import Config
from src.python.engine.db import Db
from ..auth import auth

api_io = Blueprint("io", __name__, url_prefix="/api/io")


@api_io.route("/restore", methods=["POST"])
@auth.login_required
def r_restore():
    f = request.files["file"]
    f_id = str(uuid4())
    f.save(str(Config.UPLOAD_FOLDER.joinpath(f_id)))

    with Config.UPLOAD_FOLDER.joinpath(f_id).open() as f:
        Db.insert_many([json.load(r.strip()) for r in f if r.strip()])

    return jsonify({
        "id": f_id
    })


@api_io.route("/backup")
@auth.login_required
def r_backup():
    filename = str(Config.UPLOAD_FOLDER.joinpath(str(uuid4())))

    with Config.UPLOAD_FOLDER.joinpath(filename).open("w") as f:
        for row in Db.download_all():
            f.write(json.dumps(row) + "\n")

    return send_file(filename, attachment_filename="zhdiary.ndjson", as_attachment=True, cache_timeout=-1)
