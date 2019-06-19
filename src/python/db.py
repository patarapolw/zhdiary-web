from typing import List


class Db:
    def __init__(self, file_path: str):
        pass

    def get_all(self):
        pass

    def close(self):
        pass

    @staticmethod
    def download_all(target: str):
        pass

    @staticmethod
    def parse_cond(cond: dict, offset: int, limit: int, fields: List[str] = None):
        pass

    @staticmethod
    def insert_many(c: List[dict], target: str = None):
        pass

    @staticmethod
    def update_many(ids: List[str], u: dict):
        pass

    @staticmethod
    def delete_many(ids: List[str]):
        pass

    @staticmethod
    def add_tags(ids: List[str], tags: List[str]):
        pass

    @staticmethod
    def remove_tags(ids: List[str], tags: List[str]):
        pass

    @staticmethod
    def get_media(media_id: str):
        pass

    @staticmethod
    def render(card_id: str):
        pass

    @staticmethod
    def mark_right(card_id: str):
        pass

    @staticmethod
    def mark_wrong(card_id: str):
        pass
