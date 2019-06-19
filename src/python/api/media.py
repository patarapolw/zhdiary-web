from flask import Blueprint, send_file
from io import BytesIO

from ..db import Db

api_media = Blueprint("media", __name__, url_prefix="/api/media")


@api_media.route("/<string:media_id>")
def r_media(media_id: str):
    return send_file(BytesIO(Db.get_media(media_id)))
