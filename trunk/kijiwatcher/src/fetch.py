import urllib
import os

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template

class Fetcher(webapp.RequestHandler):
    def get(self):
       
        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write('Fetcher !!!')
