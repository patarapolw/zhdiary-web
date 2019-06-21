from typing import List
from bson.objectid import ObjectId

from .template import get_template_data, get_all_data
from ..ext import mongo
from .quiz import srs_map, get_next_review, repeat_review
from .search import sorter


class Db:
    @staticmethod
    def download_all():
        for c in mongo.db.card.find({}, {"_id": 0}):
            yield c

    @staticmethod
    def parse_cond(mongo_cond: dict,
                   offset: int = 0, limit: int = None, sort_by: str = None, desc: bool = False,
                   fields: List[str] = None) -> List[dict]:
        if fields is None:
            fields = []

        fields.extend(("entry", "type", "_id"))
        fields = set(fields)
        sql_cond = mongo_cond.pop("data", None)

        all_data = dict()
        extra = list()

        if sql_cond is not None:
            type_ = sql_cond.pop("type")

            for c in mongo.db.card.find(mongo_cond, dict.fromkeys(fields, 1)):
                all_data[c["entry"]] = {
                    **c,
                    "data": get_template_data(c["entry"], type_)
                }

            for c in get_all_data(type_):
                if c["entry"] not in all_data.keys():
                    all_data[c["entry"]] = c

            if sort_by and sort_by[0] == "@":
                return sorted((v for v in all_data.values()),
                              key=sorter(sort_by[1:], desc))[offset: offset + limit if limit else None]
            else:
                extra = [v["_id"] for v in all_data.values() if v.get("_id") is None]

            mongo_cond = {"_id": {"$in": [v["_id"] for v in all_data.values() if v.get("_id")]}}

        q = mongo.db.card.find(mongo_cond, dict.fromkeys(fields, 1))

        if sort_by and sort_by[0] != "@":
            q = q.sort([(sort_by, -1 if desc else 1)])

        q = q.skip(offset)

        if limit:
            q = q.limit(limit)

        return ([{
            **c,
            "data": all_data[str(c["_id"])]["data"] if c["_id"] in all_data.keys() else None
        } for c in q] + extra)[:limit]

    @staticmethod
    def insert_many(c: List[dict]) -> List[int]:
        return mongo.db.card.insert_many(c).inserted_ids

    @staticmethod
    def update_many(ids: List[str], u: dict):
        mongo.db.card.update_many({"_id": {"$in": [ObjectId(_id) for _id in ids]}}, {"$set": u})

    @staticmethod
    def delete_many(ids: List[str]):
        mongo.db.card.delete_many({"_id": {"$in": [ObjectId(_id) for _id in ids]}})

    @staticmethod
    def add_tags(ids: List[str], tags: List[str]):
        mongo.db.card.update_many({"_id": {"$in": [ObjectId(_id) for _id in ids]}},
                                  {"$addToSet": {"tag": {"$each": tags}}})

    @staticmethod
    def remove_tags(ids: List[str], tags: List[str]):
        mongo.db.card.update_many({"_id": {"$in": [ObjectId(_id) for _id in ids]}},
                                  {"$pull": {"tag": {"$in": tags}}})

    @staticmethod
    def render(entry: str, type_: str) -> dict:
        return {
            "data": get_template_data(entry, type_)
        }

    @staticmethod
    def render_from_id(card_id: str) -> dict:
        c = Db.parse_cond({"_id": ObjectId(card_id)},
                          offset=0, limit=1, fields=[
            "front", "back"
        ])

        return c[0]

    @staticmethod
    def mark_right(card_id: str = None, card_data: dict = None):
        return Db._create_card(+1, card_id, card_data)

    @staticmethod
    def mark_wrong(card_id: str = None, card_data: dict = None):
        return Db._create_card(-1, card_id, card_data)

    @staticmethod
    def _create_card(srs_level_change: int, card_id: str = None, card_data: dict = None) -> str:
        if card_id is None:
            card = card_data
        else:
            card = mongo.db.card.find_one({"_id": ObjectId(card_id)})

        assert isinstance(card, dict)

        card.setdefault("srsLevel", 0)
        card.setdefault("streak", {
            "right": 0,
            "wrong": 0
        })

        if srs_level_change > 0:
            card["streak"]["right"] += 1
        elif srs_level_change < 0:
            card["streak"]["wrong"] += 1

        card["srsLevel"] += srs_level_change

        if card["srsLevel"] >= len(srs_map):
            card["srsLevel"] = len(srs_map) - 1

        if card["srsLevel"] < 0:
            card["srsLevel"] = 0

        if srs_level_change > 0:
            card["nextReview"] = get_next_review(card["srsLevel"])
        else:
            card["nextReview"] = repeat_review()

        if card_id is None:
            card_id = str(mongo.db.card.insert_one(card).inserted_id)
        else:
            mongo.db.card.update_one({"_id": ObjectId(card_id)}, {"$set": {
                "srsLevel": card["srsLevel"],
                "streak": card["streak"],
                "nextReview": card["nextReview"]
            }})

        return card_id
