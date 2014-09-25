import logging

from google.appengine.ext import webapp
from google.appengine.api import urlfetch

class Fetcher(webapp.RequestHandler):
    def get(self):
        url = "http://www.yahoo.com"
        result = urlfetch.fetch(url)
        self.response.out.write(result.content)