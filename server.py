import os

from src.python.server import app


if __name__ == "__main__":
    app.run(debug=True, port=os.getenv("PORT", "5000"))
