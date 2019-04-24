from dotenv import load_dotenv
import os
from pymongo import MongoClient
import regex
from wordfreq import word_frequency
from ruamel import yaml
import json

load_dotenv()

class VocabLevel:
    toTag = dict()
    toLevel = dict()

    def __init__(self):
        for i in range(6):
            with open(f"/Users/patarapolw/Downloads/zhlevel-master/resources/hsk/L{i + 1}.txt") as f:
                for row in f:
                    vocab = row.strip()
                    if vocab:
                        self.toTag[vocab] = f"HSK{i + 1}"
        
        with open("/Users/patarapolw/Downloads/zhlevel-master/resources/level/hsk.yaml") as f:
            d = yaml.safe_load(f)
            for k, vs in d.items():
                for v in vs:
                    self.toLevel[v] = int(k)
        
        with open("/Users/patarapolw/Downloads/zhlevel-master/resources/level/internet.yaml") as f:
            d = yaml.safe_load(f)
            for k, vs in d.items():
                for v in vs:
                    self.toLevel[v] = int(k)


class HanziLevel:
    toLevel = dict()


    def __init__(self):
        with open("/Users/patarapolw/Downloads/zhlevel-master/resources/level/hanzi.json") as f:
            d = json.load(f)
            for k, vs in d.items():
                for v in vs:
                    self.toLevel[v] = int(k)



if __name__ == "__main__":
    myClient = MongoClient(os.getenv("MONGO_URI"))
    zhClient = MongoClient(os.getenv("ZHFLASH_MONGO_URI"))

    hLevel = HanziLevel()
    vLevel = VocabLevel()

    usedVocab = set()
    tokens = []
    for t in zhClient.zhflash.token.find():
        if regex.search(r"\p{IsHan}", t["name"]):
            tag = vLevel.toTag.get(t["name"])
            hanziLevel = list(filter(None, map(lambda x: hLevel.toLevel.get(x), t["name"])))

            tokens.append({
                "name": t["name"],
                "sup": t["sup"],
                "sub": t["sub"],
                "var": t["variant"],
                "frequency": word_frequency(t["name"], "zh") * 10**6,
                "vocabLevel": vLevel.toLevel.get(t["name"]),
                "hanziLevel": hanziLevel if len(hanziLevel) else None,
                "tag": [tag] if tag else None
            })
            usedVocab.add(t["name"])

    for v in zhClient.zhflash.vocab.find():
        if v["simplified"] not in usedVocab:
            tag = vLevel.toTag.get(v["simplified"])
            hanziLevel = list(filter(None, map(lambda x: hLevel.toLevel.get(x), v["simplified"])))

            tokens.append({
                "name": v["simplified"],
                "frequency": word_frequency(v["simplified"], "zh") * 10**6,
                "vocabLevel": vLevel.toLevel.get(v["simplified"]),
                "hanziLevel": hanziLevel if len(hanziLevel) else None,
                "tag": [tag] if tag else None
            })
            usedVocab.add(v["simplified"])
    
    myClient.data.token.insert_many(tokens)
