from flask_pymongo import PyMongo
from authlib.flask.client import OAuth

import os

mongo = PyMongo()
oauth = OAuth()

auth0 = oauth.register(
    "auth0",
    client_id=os.getenv("AUTH0_CLIENT_ID"),
    client_secret=os.getenv("AUTH0_CLIENT_SECRET"),
    api_base_url='https://patarapolw.auth0.com',
    access_token_url='https://patarapolw.auth0.com/oauth/token',
    authorize_url='https://patarapolw.auth0.com/authorize',
    client_kwargs={
        'scope': 'openid profile email',
    },
)
