from pathlib import Path
import os
import atexit
import shutil
from dotenv import load_dotenv
load_dotenv()


class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")
    TOKEN_EXPIRATION_AGE = 36000
    ROOT = Path(__file__).joinpath("../../..").resolve()
    UPLOAD_FOLDER = ROOT.joinpath("tmp")

    UPLOAD_FOLDER.mkdir(exist_ok=True)
    atexit.register(shutil.rmtree, str(UPLOAD_FOLDER))
