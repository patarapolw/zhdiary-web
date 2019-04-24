from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()

if __name__ == "__main__":
    myClient = MongoClient(os.getenv("MONGO_URI"))

    print(myClient.data.command("aggregate", "token", pipeline=[{"$lookup":{"from":"vocab","localField":"name","foreignField":"simplified","as":"v"}},{"$unwind":{"path":"$v","preserveNullAndEmptyArrays":True}},{"$lookup":{"from":"card","let":{"entry":"$name"},"pipeline":[{"$match":{"userId":"5cc0165a6744b22c221b780a","entry":"$$name"}}],"as":"c"}},{"$unwind":{"path":"$c","preserveNullAndEmptyArrays":True}},{"$lookup":{"from":"deck","localField":"c.deckId","foreignField":"_id","as":"d"}},{"$unwind":{"path":"$d","preserveNullAndEmptyArrays":True}},{"$project":{"entry":"$name","sub":1,"sup":1,"var":1,"frequency":1,"vocabLevel":1,"hanziLevel":1,"tag":{"$concatArrays":["$tag","$c.tag"]},"simplified":"$v.simplified","traditional":"$v.traditional","pinyin":"$v.pinyin","english":"$v.english","deck":"$d.deck","cardId":"$c._id","front":"$c.front","back":"$c.back","mnemonic":"$c.mnemonic","srsLevel":"$c.srsLevel","nextReview":1,"created":1,"modified":1}},{"$match":{}},{"$project":{"nextReview":1,"srsLevel":1,"tag":1}}], explain=True))
