## 
## Converter tool to enrich TopoJSON geometries with emission time series data
##
## author: Ulrich Mann u.mann@narimo.de
## last updated: 2020-09-21
##

#!/usr/bin/env python3

import datetime
import json
from math import nan
import math
import os
import pprint
import sys

from numpy import empty

from dataconfigreader.reader import DataConfigReader
from datareader.reader import NormalizedDataReader
import pandas as pd
from settingsreader.reader import SettingsReader
from topojsonwriter.writer import TopoJSONWriter


print('\n#############################################')
print("##### Emissions data TopoJSON converter #####")
print('#############################################\n')

## Checks a numeric value.
## If it is empty, of type None, String or NaN, returns the empty string.
## Returns the value otherwise.
def getCorrectedNumericValue(expectedNumericValue):
    if not expectedNumericValue:
        return None
        
    if isinstance(expectedNumericValue, str):
        return None
    
    elif expectedNumericValue is None:
        return None
        
    elif math.isnan(expectedNumericValue):
        return None
        
    return expectedNumericValue

##############
## Settings ##
##############

sreader = SettingsReader()
sreader.read('settings.json')
    
generalSettings = sreader.generalsettings
debugsettings  = sreader.debugsettings

adminLevels = sreader.adminlevels
adminLevel = sreader.adminlevel
if(adminLevel is not None and adminLevel is not ""):
    adminLevels = [adminLevel]
    
for adminLevel in adminLevels:
    px = sreader.datasettings[adminLevel]
    for p in px:
    
        groupmax = 0
        
        for run in [1,2]:
            # make a second run for each group to write documents with complete groupmax value
            if(not generalSettings['calculateGroupMaxValue'] and run == 2):
                pass
                
            timeSeriesEndYear = datetime.datetime.now().year
            pp = pprint.PrettyPrinter(indent=4)
            defaultOutfileName = 'output'
            
            print('\n###########')
            print('## INPUT ##')
            print('###########')
            
            ####################
            ## Read ISO codes ##
            ####################
            
            if(p['useIsoCodeMatching']):
                ## Read geometry iso codes for matching countries with attribute data
                iso3 = pd.read_csv(p['countriesCSV'], index_col = p['iso3CountryColumn'], skip_blank_lines = True, encoding=p['csvEncoding'], engine='python')
                print("\nNumber of available ISO geometry definitions (", p['countriesCSV'], "): ", len(iso3.index))
                
                ## Read geometry iso codes for countries with naming disputes or different names
                iso3custom = pd.read_csv(p['countriesCSVcustom'], index_col = p['iso3CustomCountryColumn'], skip_blank_lines = True, encoding=p['csvEncoding'], engine='python')
                print("\nNumber of available custom ISO geometry definitions(", p['countriesCSVcustom'], "): ", len(iso3custom.index))
                
                
            #####################################
            ## Read geometry center coordinates ##
            #####################################
            centerCoordinates = None
            if(p['readAreaCenterCoordinates']):
                centerCoordinates = pd.read_csv(p['centerCoordinatesFile'], skip_blank_lines = True, encoding=p['csvEncoding'], engine='python')
                print("\nNumber of available geometry center coordinates(", p['centerCoordinatesFile'], "): ", len(centerCoordinates.index))
                if(centerCoordinates.empty):
                    print("\n=> Error. No center coordinates are defined. Cannot add center coordinates to output data.")
                    
                    
            #################################
            ## Read input data definitions ##
            #################################
            
            dcreader = DataConfigReader()
            dcreader.read(p['dataConfigFile'])
                
            if (len(p['featuretypeToProcess']) == 0):
                print("\nProcessing all available feature types")
                for ft in dcreader.featuretypes:
                    print("\n",ft)
                    
            cnt = 0;
            ## loop all feature types and optionally process them
            for featuretype in dcreader.featuretypes: 
                
                minval = 0
                maxval = 0
                
                ## reporting definitions
                countriesWithoutData = []
                unknownCenterCoordinates = []
                
                if(len(p['featuretypeToProcess']) > 1 and p['featuretypeToProcess']!=featuretype):
                    # do not process current feature type if we defined a specific feature type to process
                    continue
                
                print('\n#############################')
                print('## PROCESSING FEATURE TYPE ##')
                print(featuretype)
                print('#############################')
                
                metadata = dcreader.getMetadata(featuretype)
                reference = dcreader.getReference(featuretype)
                ftSettings = dcreader.getSettings(featuretype)
                
                dataFile = dcreader.getDataFile(featuretype)
                filename, dataType = os.path.splitext(dataFile)
                
                sheetName = dcreader.getSheetName(featuretype)
                datafileAreaColumn = dcreader.getDataFileAreaColumn(featuretype)
                datafileYearColumn = dcreader.getDataFileYearColumn(featuretype)
                datafileValueColumn = dcreader.getDataFileValueColumn(featuretype)
                skipRows = dcreader.getSkipRows(featuretype)
                nrows = dcreader.getNRows(featuretype)
                restrictWhereString = dcreader.getRestrictWhereString(featuretype)
                normalizationFactor = dcreader.getNormalizationFactor(featuretype)
                timeSeriesStartYear = dcreader.getTimeseriesStartYear(featuretype, generalSettings['timeSeriesStartYear'])
                
                writeAllFeatureTypesToSingleFile = p['writeAllFeatureTypesToSingleFile']
                
                try:
                    subtype = dcreader.getSubtype(featuretype)
                except KeyError:
                    print("\n=> Error: settings -> subtype is not defined for feature type ", featuretype, " in the data config file ", p['dataConfigFile'])
                    quit()
                    
                try:
                    component = dcreader.getComponent(featuretype)
                except KeyError:
                    print("\n=> Error: settings -> component is not defined for feature type ", featuretype, " in the data config file ", p['dataConfigFile'])
                    quit()
                    
                try:
                    emissionType = dcreader.getEmissionType(featuretype)
                except KeyError:
                    print("\n=> Error: settings -> emissionType is not defined for feature type ", featuretype, " in the data config file ", p['dataConfigFile'])
                    quit()
                    
                try:
                    referenceType = dcreader.getReferenceType(featuretype)
                except KeyError:
                    print("\n=> Error: settings -> referenceType is not defined for feature type ", featuretype, " in the data config file ", p['dataConfigFile'])
                    quit()
                    
                useIsoCodeMatching = dcreader.getIsoCodeMatching(featuretype, p['useIsoCodeMatching'])
                    
                defaultOutfileName = adminLevel + "_" + component + "_" + emissionType + "_" + referenceType
                if(subtype):
                    defaultOutfileName += "_" + subtype
                
                if(debugsettings['verbose']):
                    print("\n=== data config ===")
                    print("\nreference: ")
                    pp.pprint(reference)
                    print("\nmetadata: ")
                    pp.pprint(metadata)
                    print("\nsettings: ")
                    pp.pprint(ftSettings)
                    print("\n=== data config ===")
                
                
                ###########################
                ## Read domain data file ##
                ###########################
                
                writer = TopoJSONWriter()
                writer.topojsonIn = p['topojsonRawFile']
                
                if(writeAllFeatureTypesToSingleFile):
                    if(writer.topojsonOut == None):
                        print("\n=> Warning: writeAllFeatureTypesToSingleFile is true, but no topojson file has been defined for data output. Writing to new file.")
                    else:
                        writer.topojsonIn = writer.topojsonOut
                
                writer.read()
                topojson = writer.topojson
                
                ###################################################
                ## Read domain data file to normalized dataframe ##
                ###################################################
                
                dr = NormalizedDataReader()
                dr.restrictWhereString = restrictWhereString
                dr.rowConstraintSeparator = generalSettings['rowConstraintSeparator']
                dr.verbose = debugsettings['verbose']
                
                if(dataType == '.xlsx'):
                    dr.readExcel(dataFile, sheetName, skipRows, nrows, datafileAreaColumn)
                    
                elif(dataType == '.csv'):
                    dr.readCSV(dataFile, skipRows, nrows, True, p['csvEncoding'], datafileAreaColumn, datafileYearColumn, datafileValueColumn)
                    
                else:
                    print("\n=> Error: Data type ", dataType, " is currently not supported.")
                    quit()
                    
                
                ######################################
                ## Merge domain data with ISO codes ##
                ######################################
                
                
                if(useIsoCodeMatching and sreader.useCustomIsoCodeMatching):
                    # merge ISO 3 standard values
                    domainData_merged = dr.domainData.merge(iso3, left_on = datafileAreaColumn, right_on = p['iso3CountryColumn']) 
                    print("\nNumber of ISO matched datasets: ", len(domainData_merged.index))
                    
                    # merge ISO 3 custom values
                    domainData_merged_custom = dr.domainData.merge(iso3custom, left_on = datafileAreaColumn, right_on = p['iso3CustomCountryColumn']) 
                    print("\nNumber of custom ISO matched datasets: ", len(domainData_merged_custom.index))
                
                else:
                    domainData_merged = dr.domainData
                    domainData_merged_custom = None
                    
                ####################################
                ## Append domain data to topojson ##
                #################################### 
                
                geometryCollection = topojson['objects']['collection']
                
                # check correct type GeometryCollection
                if geometryCollection['type'] != 'GeometryCollection':
                    print ('\n=> Error: Country objects in', topojsonIn,'are not of correct type GeometryCollection.');
                    quit()
                    
                ###########################
                ## Write domain metadata ##
                ###########################
                try:
                    topojson['properties']['attributes'][featuretype] = metadata
                except:
                    try:
                        topojson['properties']['attributes'] = {}
                        topojson['properties']['attributes'][featuretype] = metadata
                    except:
                        topojson['properties'] = {}
                        topojson['properties']['attributes'] = {}
                        topojson['properties']['attributes'][featuretype] = metadata
                    
                ############################
                ## Write time series data ##
                ############################
                print("\nNumber of topojson geometries: ", len(geometryCollection['geometries']))
                
                print('\n')
                print('## PROCESSING ##')
                print('################')
                print('\n')
            
                count = 0
                for geometry in geometryCollection['geometries']:
                    
                    count+=1
                    
                    if(debugsettings['verbose']):
                        print('\n')
                        
                    if(count>1 and not debugsettings['verbose']):
                        sys.stdout.write("\033[F")
             
                    print('Writing to geometry',count,'out of',len(geometryCollection['geometries']))
                    
                    areaCode = geometry['properties'][p['topojsonJoinProperty']]
                    
                    if(debugsettings['verbose']):
                        if(debugsettings['debugISOCountry'] == areaCode):
                            print('=====================================')
                            print('=== Debugging geometry',debugsettings['debugISOCountry'],'===')
                        print('Area code ##',areaCode, "##")
                        
                        
                    ##########################################
                    ## Determine geometry center coordinates ##
                    ##########################################
                    
                    if (not centerCoordinates is None and not centerCoordinates.empty):
                        center_geometry = centerCoordinates.loc[centerCoordinates[p['centerCoordsJoinColumn']] == areaCode]
                        
                        try:
                            latitude = center_geometry.iloc[0].get('latitude')
                            longitude = center_geometry.iloc[0].get('longitude')
                        except:
                            latitude = 'unknown'
                            longitude = 'unknown'
            
                        correctedLat = getCorrectedNumericValue(latitude)
                        correctedLon = getCorrectedNumericValue(longitude)
            
                        if(correctedLon!=longitude or correctedLat!=latitude):
                            unknownCenterCoordinates.append(areaCode)
                            if(debugsettings['verbose']):
                                print("\n=> Error: Unknown center coordinates")
                      
                      
                        geometry['properties']['center-lat'] = correctedLat
                        geometry['properties']['center-lon'] = correctedLon
                        
                        
                    ####################################
                    ## Add geometry type/ admin level ##
                    ####################################
                    
                    if (not adminLevel is None):
                        geometry['properties']['type'] = adminLevel
                            
                        
                    ##################################
                    ## Determine geometry timeseries ##
                    ##################################
            
                    timeseries = {}
                    if(writeAllFeatureTypesToSingleFile):
                        try:
                            timeseries = geometry['properties']['timeseries']
                        except:
                            pass
            
                    timeseries[featuretype] = {}
                        
                    joinColumn = None
                    try:
                        joinColumn = p['joinColumn']
                    except:
                        pass
                        
                    joinCustomColumn = None
                    try:
                        joinCustomColumn = p['joinCustomColumn']
                    except:
                        pass
                    
                    domainDataRow = dr.getDomainDataRow(datafileAreaColumn, domainData_merged, domainData_merged_custom, useIsoCodeMatching, 
                                                        sreader.useCustomIsoCodeMatching, joinColumn, joinCustomColumn, areaCode)
                    
                    if domainDataRow.empty:
                        countriesWithoutData.append(areaCode)
                        
                    countryName = ""
                    if (not datafileAreaColumn is None and not domainDataRow.empty):
                        countryName = domainDataRow.iloc[0].get(datafileAreaColumn)
                    
                    if(debugsettings['verbose']):
                        if(debugsettings['debugISOCountry'] == areaCode):
                            print('=== Domain data values:',domainDataRow,'===')
                            print('=== Country name:',countryName,'===')
                            print('=== Debugging geometry',debugsettings['debugISOCountry'],'===')
                            print('=====================================')
                            
                    try:
                        dr.unmatchedDatasets.remove(countryName)
                    except:
                        if(debugsettings['verbose']):
                            print('Could not remove', countryName, 'from unmatched dataset list. This might be a bug an does not effect reporting.')
                            
                    for year in range(timeSeriesStartYear, timeSeriesEndYear):
                        emissionValue = ""
                        if(not domainDataRow.empty):
                            emissionValue = domainDataRow.iloc[0].get(year)
                        emissionValue = getCorrectedNumericValue(emissionValue)
                        if(emissionValue == None):
                            emissionValue = ""
                        else:
                            emissionValue = float(emissionValue) * float(normalizationFactor)
                        
                        if isinstance(emissionValue, float) or isinstance(emissionValue, int):
                            if(minval == 0 or emissionValue < minval):
                                minval = emissionValue
                            if(maxval == 0 or emissionValue > maxval):
                                maxval = emissionValue
                            if(groupmax == 0 or emissionValue > groupmax):
                                groupmax = emissionValue    
                        
                        timeseries[featuretype][year] = emissionValue
                        geometry['properties']['timeseries'] = timeseries
                    
                ## write min/ max values to metadata
                topojson['properties']['attributes'][featuretype]['measurements-units']['value-min'] = minval
                topojson['properties']['attributes'][featuretype]['measurements-units']['value-max'] = maxval
                topojson['properties']['attributes'][featuretype]['measurements-units']['group-max'] = groupmax
                            
                ###############
                ## Reporting ##
                ###############
                
                print('\n')
                print('## REPORT ##')
                print('############')
                
                if (not centerCoordinates is None and centerCoordinates.empty):
                    print('\n=> No center coordinates are defined. Could not add center coordinates to output data. '+ 
                    'Please review that the input file for coordinates exists:', centerCoordinatesFile, '.')
                print('\n=> Unknown center coordinates given for these countries:', unknownCenterCoordinates)
                print('\n=> Could not match these geometry codes from topojson with a geometry:', countriesWithoutData)
                print('\n=> Could not append these domain datasets to topojson (no matching geometry codes in topojson):', dr.unmatchedDatasets)
                
                
                ##############################
                ## Export merged data series ##
                ##############################
                
                if(generalSettings['calculateGroupMaxValue'] and run == 1):
                    # do nothing, just proceed to run 2
                    pass
                else:
                    outpath = 'data/out'
                    if(not writeAllFeatureTypesToSingleFile or writer.topojsonOut == None):
                        writer.topojsonOut = outpath+'/'+defaultOutfileName+'.topojson'
                    print('\n Writing to',writer.topojsonOut)
                    
                    writer.write(topojson, generalSettings['prettyPrintOutput'])
                
                ## increment processed datasets counter
                cnt+=1
                
                
            #####################
            ## Final Reporting ##
            #####################
            
            print('\n##############################################')
            print('## FINAL REPORT ##')
            print('##############################################')
            
            print('\nProcessed', cnt, "feature type(s).")
            print('\n')
