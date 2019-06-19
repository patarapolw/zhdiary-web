from flask import Blueprint, request, jsonify
import jieba
from wordfreq import word_frequency

api_util = Blueprint('util', __name__, url_prefix="/api/util")


@api_util.route("/jieba/cut", methods=["POST"])
def r_jieba_cut():
    entry = request.json["entry"]
    return jsonify({
        "result": list(jieba.cut(entry))
    })


@api_util.route("/jieba/cutForSearch", methods=["POST"])
def r_jieba_cfs():
    entry = request.json["entry"]
    return jsonify({
        "result": list(jieba.cut_for_search(entry))
    })


@api_util.route("/wordfreq", methods=["POST"])
def r_wordfreq():
    entry = request.json["entry"]
    return jsonify({
        "frequency": word_frequency(entry, "zh-CN") * 10**6
    })
