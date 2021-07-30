##
## author: Ulrich Mann u.mann@narimo.de
## 2020-08-20
##
import json

class SettingsReader():
    
    def __init__(self):
        self.adminlevel = ""
        self.adminlevels = ""
        self.datasettings = []
        self.generalsettings = {}
        self.debugsettings = {}
        
        self.useCustomIsoCodeMatching = None
    
    def read(self, file):
        with open(file, 'r') as config_file:
            config = json.load(config_file)
            
            self.adminlevel = config['adminLevel']
            self.adminlevels = config['adminLevels']
            self.datasettings = config['data']
            self.generalsettings = config['general']
            self.debugsettings = config['debug']
            
            try:
                self.useCustomIsoCodeMatching = self.generalsettings['useCustomIsoCodeMatching']
            except:
                pass
