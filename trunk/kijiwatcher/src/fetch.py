import urllib2

from google.appengine.ext import webapp
from google.appengine.api import urlfetch



class Fetcher(webapp.RequestHandler):
    def get(self):
        url = "http://d1dsp.westjet.com"
        result = urlfetch.fetch(url)
        self.response.out.write(result.content)