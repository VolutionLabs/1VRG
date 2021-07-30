##
## author: Ulrich Mann u.mann@narimo.de
## 2020-08-20
##
import json
import os

class TopoJSONWriter():
    
    def __init__(self):
        self.topojson = ""
        self.topojsonIn = None
        self.topojsonOut = None
    
    # reads a json file for further usage
    def read(self):
        with open(self.topojsonIn, 'r') as jsonfile:
            self.topojson = json.load(jsonfile)
            
    # writes a topojson structure to a file
    # optionally uses pretty print
    def write(self, topojson, pretty):
        os.makedirs(os.path.dirname(self.topojsonOut), exist_ok = True)
        with open(self.topojsonOut, 'w') as outfile:
            if(pretty):
                json.dump(topojson, outfile, indent=4, ensure_ascii=False)
            else:
                json.dump(topojson, outfile, ensure_ascii=False)