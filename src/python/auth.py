from flask import Blueprint, request, abort, jsonify, g, session, url_for, redirect
from flask_httpauth import HTTPTokenAuth
from itsdangerous import (TimedJSONWebSignatureSerializer
                          as Serializer, BadSignature, SignatureExpired)
import os
import secrets
from urllib.parse import urlencode

from .ext import mongo, auth0
from .config import Config

auth = HTTPTokenAuth(scheme="Token")
api_auth = Blueprint('auth', __name__, url_prefix="/api/auth")


def jws_generate(user: dict):
    s = Serializer(Config.SECRET_KEY, expires_in=Config.TOKEN_EXPIRATION_AGE)
    return s.dumps({'email': user["email"]})


def jws_verify(token):
    s = Serializer(Config.SECRET_KEY)
    try:
        data = s.loads(token)
    except SignatureExpired:
        return None  # valid token, but expired
    except BadSignature:
        return None  # invalid token

    user = mongo.db.user.find_one({"email": data["email"]})
    return user


@auth.verify_token
def auth_verify_token(token):
    user = jws_verify(token)
    if not user:
        if "profile" in session:
            user = session["profile"]
            db_user = mongo.db.user.find_one({"email": user["email"]})

            if db_user:
                user = {
                    **db_user,
                    **user
                }
            else:
                user = {
                    "secret": secrets.token_urlsafe(),
                    **user
                }
                mongo.db.user.insert_one(user)

    if user:
        g.user = user
        return True

    return False


@api_auth.route("/login", methods=["GET", "POST"])
def r_login():
    if request.method == "POST":
        r = request.json
        user = mongo.db.user.find_one({"email": r["email"]})

        if user["secret"] != r["secret"]:
            return abort(400)

        session['profile'] = {
            'picture': user['picture'],
            "email": user["email"]
        }

        g.user = user
        token = jws_generate(user)
        return jsonify({'token': token.decode('ascii'), 'duration': Config.TOKEN_EXPIRATION_AGE})
    else:
        return auth0.authorize_redirect(
            redirect_uri=os.getenv("AUTH0_CALLBACK_URL"),
            audience='https://patarapolw.auth0.com/userinfo'
        )


@api_auth.route("/logout")
def r_logout():
    session.clear()
    params = {'returnTo': url_for('r_index', _external=True), 'client_id': os.getenv("AUTH0_CLIENT_ID")}
    return redirect(auth0.api_base_url + '/v2/logout?' + urlencode(params))


@api_auth.route('/token')
@auth.login_required
def r_get_auth_token():
    token = jws_generate(g.user)
    return jsonify({
        'token': token.decode('ascii'),
        'duration': Config.TOKEN_EXPIRATION_AGE
    })


@api_auth.route('/secret')
@auth.login_required
def r_get_secret():
    return jsonify({
        "secret": g.user["secret"]
    })


@api_auth.route('/profile')
@auth.login_required
def r_get_profile():
    return jsonify(session["profile"])
