##
## author: Ulrich Mann u.mann@narimo.de
## 2020-09-17
##
import collections

import pandas as pd


class NormalizedDataReader():
    
    def __init__(self):
        self.domainData = pd.DataFrame()
        self.unmatchedDatasets = []
        self.restrictWhereString = None
        self.rowConstraintSeparator = "="
        self.geometries = set() # names of geometries/ areas/ categories within an area column
        self.verbose = False
        self.__ReadRowsOnly = collections.namedtuple('ReadRowsOnly', ['key', 'value'])
        
    def readExcel(self, dataFile, sheetName, skiprows, nrows, datafileAreaColumn):
        self.domainData = pd.read_excel(dataFile, sheet_name=sheetName, skiprows=skiprows, nrows=nrows)
        print("\nReading domain data from", dataFile, ", sheet:", sheetName)
        
        if not(self.restrictWhereString is None):
            print("Reading only rows where constraint:",self.restrictWhereString)
            self.domainData = self.subsetDataframe(self.domainData, self.restrictWhereString, dataFile)
            
        # remove empty data lines
        dataIndicesNaN = self.domainData[self.domainData[datafileAreaColumn].isnull()].index
        self.domainData.drop(dataIndicesNaN , inplace=True)
        
        print("Number of available domain data sets (", dataFile, "): ", len(self.domainData.index))
        self.unmatchedDatasets = self.domainData[datafileAreaColumn].tolist()
        
    def readCSV(self, dataFile, skiprows, nrows, skip_blank_lines, encoding, datafileAreaColumn, datafileYearColumn, datafileValueColumn):
        self.domainData = pd.read_csv(dataFile, skiprows=skiprows, nrows=nrows, skip_blank_lines = skip_blank_lines, encoding=encoding, engine='python')
        print("\nReading domain data from", dataFile)
        
        if not(self.restrictWhereString is None):
            print("Reading only rows where constraint:",self.restrictWhereString)
            self.domainData = self.subsetDataframe(self.domainData, self.restrictWhereString, dataFile)
            
        print("Number of available domain data sets (", dataFile, "): ", len(self.domainData.index))
            
        if not(datafileAreaColumn is None):
            self.geometries = set(self.domainData[datafileAreaColumn].tolist())
            if(self.verbose):
                print("Geometries: \n", self.geometries)
        
        # normalize the dataframe, if neccessary
        if(datafileYearColumn):
            df_normalized = None
            
            if(len(self.geometries) > 0):
                for geom in self.geometries:
                    subset = self.subsetDataframe(self.domainData, datafileAreaColumn+"="+geom, dataFile)
                    df_normalized = self.normalizeDataframe(subset, df_normalized, datafileAreaColumn, datafileYearColumn, datafileValueColumn, geom)
            else:
                geom = None # Fix for adding a geometry name when we only have a single geometry per file
                df_normalized = self.normalizeDataframe(self.domainData, df_normalized, datafileAreaColumn, datafileYearColumn, datafileValueColumn, geom)
            
            if(self.verbose):
                print("Normalized domain data:\n", df_normalized)
                
            self.domainData = df_normalized
            
    ## Returns a subset of a dataframe
    ## where a given column name contains a specified value.
    ## Returns the original dataframe, if no key/ value pair for the subset could be determined.
    def subsetDataframe(self, dataframe, restrictWhereString, dataFile):
        readRowsOnlyKVP = self.__readKeyValue(restrictWhereString)
        if (readRowsOnlyKVP is None):
            print("\n=> Error: Attempted to restrict rows to be read in", dataFile, "but got no valid constraint. Continuing anyway. Please review output!")
        else:
            dataframe = dataframe.loc[dataframe[readRowsOnlyKVP.key] == readRowsOnlyKVP.value]
        return dataframe
    
    ## Read a key value pair from a string.
    def __readKeyValue(self, keyValueString):
        separator = self.rowConstraintSeparator
        if separator not in keyValueString: 
            return None
    
        split = keyValueString.split(separator)
        return self.__ReadRowsOnly(key=split[0].strip(), value=split[1].strip())
    
    
    ## Will take an input data frame like
    ## (area)     year     value
    ## (area0)    year0    some_value
    ## (area0)    year1    some_value
    ##
    ## Will attempt to create a normalized data structure like
    ## (area)     year0         year1         year2
    ## (area0)    some_value    some_value    some_value
    ##
    ## Assumes, the input dataframe contains values with a year column with distinct years and a value column.
    def normalizeDataframe(self, df0, df1, area_column, year_column, value_column, area_name):
        df1_area_column = area_column
            
        if(df1 is None):
            if(df1_area_column):
                df1 = pd.DataFrame(columns = [df1_area_column]) 
            else:
                df1 = pd.DataFrame()
           
        df1_index = len(df1)
        
        for index, row in df0.iterrows():
            if(area_column and not row[area_column] == area_name):
                continue
            
            year = row[year_column]

            # populate year column
            df1.at[df1_index, year] = row[value_column]
            
            # optionally set the geometry name for this row
            if(area_name and df1_area_column):
                df1.at[df1_index, df1_area_column] = area_name
        
        return df1
    
    ## Returns a data row from the domainData dataframe.
    ## Retuns a row indicated by the areaCode.
    ## If no datafileAreaColumn is given, returns the first (and only) row from the dataframe.
    def getDomainDataRow(self, datafileAreaColumn, domainData_merged, domainData_merged_custom, useIsoCodeMatching, useCustomIsoCodeMatching, joinColumn, joinCustomColumn, areaCode):
        
        if datafileAreaColumn is None:
            if(len(domainData_merged) > 1):
               raise ValueError("The normalized dataframe should only have a single row, since no area column is given.")
            # get the first and only row
            domainDataRow = domainData_merged.iloc[[0]]
        else:
            search_column = datafileAreaColumn
            if(useIsoCodeMatching):
                search_column = joinColumn
                
            domainDataRow = domainData_merged.loc[domainData_merged[search_column] == areaCode]
            
        
        if domainDataRow.empty:
            ## Try custom iso code matching for edge cases
            ## That is, countries that have naming disputes in ISO/ UN sources
            
            ## Using custom matching defined in geometry-iso-codes-edgecases.csv,
            ## ISO codes in the topojson will have the values from the corresponding geometry name assigned.
            ## If a geometry name is given for multiple ISO codes, those ISO codes will get the same values assigned!
            if(useIsoCodeMatching and useCustomIsoCodeMatching and domainData_merged_custom is not None):
                domainDataRow = domainData_merged_custom.loc[domainData_merged_custom[joinCustomColumn] == areaCode]
                

            if domainDataRow.empty:
                if(self.verbose):
                    if(useIsoCodeMatching):
                        print('No ISO code match found')
            else:
                if(self.verbose and useIsoCodeMatching):
                    print('Matched from custom ISO references')
            
        else:
            if(self.verbose and useIsoCodeMatching):
                print('Matched from standard ISO references')
                
        return domainDataRow
    
            