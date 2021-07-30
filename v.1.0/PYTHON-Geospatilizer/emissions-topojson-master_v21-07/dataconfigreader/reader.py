import json

class DataConfigReader():
    
    def __init__(self):
        self.featuretypes = []
    
    def read(self, file):
        with open(file, 'r') as config_file:
            data_config = json.load(config_file)
            
            self.featuretypes = data_config['featuretypes']
            
            
    def getMetadata(self, featuretype):
        return self.featuretypes[featuretype]['metadata']
    
    def getReference(self, featuretype):
        return self.featuretypes[featuretype]['reference']
        
    def getSettings(self, featuretype):
        return self.featuretypes[featuretype]['settings']
    
    
    ## references ##
    def getDataFile(self, featuretype):
        return self.featuretypes[featuretype]['reference']['file']
    

    def getSheetName(self, featuretype):
        try:
            return self.featuretypes[featuretype]['reference']['sheetname']
        except:
            return None
            
    def getDataFileAreaColumn(self, featuretype):
        try:
            return self.featuretypes[featuretype]['reference']['area-column']
        except:
            return None
            
    def getDataFileYearColumn(self, featuretype):
        try:
            return self.featuretypes[featuretype]['reference']['year-column']
        except:
            return None
            
            
    def getDataFileValueColumn(self, featuretype):
        try:
            return self.featuretypes[featuretype]['reference']['value-column']
        except:
            return None
        
    def getSkipRows(self, featuretype):
        try:
            return self.featuretypes[featuretype]['reference']['skipInitialRows']
        except:
            return 0
        
    def getNRows(self, featuretype):
        try:
            nrows = self.featuretypes[featuretype]['reference']['readRowsUntil']
            # at least xlsx row index seems to be 0-based, therefore deduct 1
            return nrows - skipRows -1
        except:
            return None    

    def getRestrictWhereString(self, featuretype):
        try:
            return self.featuretypes[featuretype]['reference']['restrict-where']
        except KeyError:
            return None
        
        
    ## settings ##
    
    def getNormalizationFactor(self, featuretype):
        try:
            # normalize domain values
            return self.featuretypes[featuretype]['settings']['normalizationFactor']
        except KeyError:
            return 1
            
    def getTimeseriesStartYear(self, featuretype, default):
        try:
            return self.featuretypes[featuretype]['settings']['timeSeriesStartYear']
        except KeyError:
            return default
        
    def getIsoCodeMatching(self, featuretype, default):
        try:
            return self.featuretypes[featuretype]['settings']['useIsoCodeMatching']
        except KeyError:
            return default
                
    def getSubtype(self, featuretype):
        return self.featuretypes[featuretype]['settings']['subtype']
    
    def getComponent(self, featuretype):
        return self.featuretypes[featuretype]['settings']['component']
    
    def getEmissionType(self, featuretype):
        return self.featuretypes[featuretype]['settings']['emissionType']
        
    def getReferenceType(self, featuretype):
        return self.featuretypes[featuretype]['settings']['referenceType']
        
                 