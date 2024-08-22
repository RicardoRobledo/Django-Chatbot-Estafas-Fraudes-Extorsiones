from .base import *
import sys


DEBUG = False

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'django-chatbot-estafas-fraudes.onrender.com']


__import__('pysqlite3')
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
