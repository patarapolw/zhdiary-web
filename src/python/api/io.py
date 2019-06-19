from flask import Blueprint, request, jsonify, send_file
from uuid import uuid4

from ..config import Config
from ..db import Db
from ..auth import auth

api_io = Blueprint("io", __name__, url_prefix="/api/io")


@api_io.route("/restore", methods=["POST"])
@auth.login_required
def r_restore():
    f = request.files["file"]
    f_id = str(uuid4())
    f.save(str(Config.UPLOAD_FOLDER.joinpath(f_id)))

    import_db = Db(str(Config.UPLOAD_FOLDER.joinpath(f_id)))
    Db.insert_many(import_db.get_all())

    return jsonify({
        "id": f_id
    })


@api_io.route("/backup")
@auth.login_required
def r_backup():
    filename = str(Config.UPLOAD_FOLDER.joinpath(str(uuid4())))
    Db.download_all(str(Config.UPLOAD_FOLDER.joinpath(filename)))

    return send_file(filename, attachment_filename=f"backup.db", as_attachment=True, cache_timeout=-1)
