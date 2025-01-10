import atexit
import multiprocessing
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

basedir = os.path.abspath(os.path.dirname(__file__))
engine = create_engine(f"sqlite:///{basedir}/state/state.db")
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

from .state import State  # noqa: E402

app_state = State()

from flask_executor import Executor  # noqa: E402

executor = Executor()
log_queue = multiprocessing.Queue(-1)

from .app import create_app  # noqa: E402
from .config import config_by_name  # noqa: E402, F401
from .loader import loader  # noqa: E402, F401
from .routes import initiate_load, initiate_reload  # noqa: E402, F401

application = create_app(os.getenv("FLASK_ENV") or "test")


def session_remove():
    Session.remove()


atexit.register(session_remove)
