#!/usr/bin/env python
# coding: utf-8

# In[1]:


get_ipython().magic(u'matplotlib inline')
import matplotlib.pyplot as plt

import pandas as pd
import geopandas as gpd
import topojson
from shapely import geometry
get_ipython().magic(u'matplotlib inline')
import geojsonio
import logging
import time
import traceback
import xlrd
import csv
import sys
import re
import cesiumpy
import os
import numpy as np
import seaborn as sns
import datetime


# In[2]:


# Enable multioutput per cell
from IPython.core.interactiveshell import InteractiveShell
InteractiveShell.ast_node_interactivity = "all"


# In[15]:



shapefile = 'data/countries_110m/ne_110m_admin_0_countries.shp'
#Read shapefile using Geopandas
gdf = gpd.read_file(shapefile)[['ADMIN', 'ADM0_A3', 'geometry']]
#Rename columns.
gdf.columns = ['country', 'country_code', 'geometry']


# In[16]:


map_df = gdf


# In[17]:


map_df.head()


# In[18]:


map_df.info()


# In[19]:


map_df.plot()


# In[20]:


print(gdf[gdf['country'] == 'Antarctica'])
#Drop row corresponding to 'Antarctica'
gdf = gdf.drop(gdf.index[159])


# In[21]:


print(gdf[gdf['country'] == 'Singapore'])


# In[22]:


grid_crs=gdf.crs
grid_crs


# In[23]:


import json
#Read data to json.
gdf_json = json.loads(gdf.to_json())
#Convert to String like object.
grid = json.dumps(gdf_json)


# In[24]:


datafile_2='data/country_geocodes.csv'
geocodes = pd.read_csv(datafile_2, names = ['country', 'latitude', 'longitude'], skiprows = 1, index_col=0)
geocodes.head()


# In[25]:


geocodes.info()


# In[26]:


geodata = pd.merge(gdf, geocodes, left_on='country',right_on='country', how='left')
geodata.head()


# In[27]:


geodata.info()


# # ATTRIBUTE TABLES

# ## GLOBAL

# ## Global Carbon Project - 2019 Global Budget v1.0 

# In[28]:


global_carbon_budget = pd.read_csv('data/openclimatedata/gcb/global-carbon-budget.csv', sep=",", header=0, parse_dates=True)
historical_budget = pd.read_csv('data/openclimatedata/gcb/historical-budget.csv', sep=",", header=0, parse_dates=True)    

ocean_sink = pd.read_csv('data/openclimatedata/gcb/ocean-sink.csv', sep=",", header=0, parse_dates=True)
terrestrial_sink = pd.read_csv('data/openclimatedata/gcb/terrestrial-sink.csv', sep=",", header=0, parse_dates=True)                
land_use_change = pd.read_csv('data/openclimatedata/gcb/land-use-change.csv', sep=",", header=0, parse_dates=True)


# In[29]:


global_carbon_budget.set_index('Year', inplace=True)
historical_budget.set_index('Year', inplace=True)

ocean_sink.set_index('Year', inplace=True)
terrestrial_sink.set_index('Year', inplace=True)
land_use_change.set_index('Year', inplace=True)


# In[30]:


global_carbon_budget.head(5) 
historical_budget.head(5) 


# In[31]:


ocean_sink.head(5)  
terrestrial_sink.head(5)  
land_use_change.head(5) 


# In[32]:


str(ocean_sink.columns.tolist())
str(terrestrial_sink.columns.tolist())
str(land_use_change.columns.tolist())


# In[33]:


### drop useless columns for geographic purposes

cols_to_drop_d5 = ['CESM-ETH', 'CSIRO', 'MITgcm-REcoM2', 'MPIOM-HAMOCC', 'NEMO-PISCES (CNRM)', 'NEMO-PlankTOM5', 'NorESM-OC', 'MOM6-COBALT (Princeton)', 'NEMO-PISCES (IPSL)', 'MMM (multi-model mean)', 'Landschützer', 'Rödenbeck', 'CMEMS', 'MPM (multi-product mean)']

ocean_sink.drop(cols_to_drop_d5, axis=1, inplace=True)

ocean_sink.head(3)


# In[34]:


cols_to_drop_d6 = ['CABLE', 'CLASS-CTEM', 'CLM5.0', 'DLEM', 'ISAM', 'ISBA-CTRIP', 'JSBACH', 'JULES', 'LPJ-GUESS', 'LPJ', 'LPX', 'OCNv2', 'ORCHIDEE-CNP', 'ORCHIDEE-Trunk', 'SDGVM', 'VISIT', 'MMM (multi-model mean)']


terrestrial_sink.drop(cols_to_drop_d6, axis=1, inplace=True)

terrestrial_sink.head(3)


# In[35]:


cols_to_drop_d7 = ['H&N', 'BLUE', 'CABLE', 'CLASS-CTEM', 'CLM5.0', 'DLEM', 'ISAM', 'ISBA-CTRIP', 'JSBACH', 'JULES', 'LPJ-GUESS', 'LPJ', 'LPX', 'OCNv2', 'ORCHIDEE-CNP', 'ORCHIDEE-Trunk', 'SDGVM', 'MMM (multi-model mean)']

land_use_change.drop(cols_to_drop_d7, axis=1, inplace=True)

land_use_change.head(3)


# In[36]:


merg = ocean_sink.merge(terrestrial_sink, left_on = 'Year', right_on = 'Year')
merg.head(5)


# In[37]:


merge = merg.merge(land_use_change, left_on = 'Year', right_on = 'Year')
merge.head(5)


# In[38]:


global_carbon_budget.head(5)


# In[39]:


str(global_carbon_budget.columns.tolist())


# In[40]:


cols_to_drop_global_carbon_budget = ['Ocean-Sink', 'Land-Use-Change-Emissions']

global_carbon_budget.drop(cols_to_drop_global_carbon_budget, axis=1, inplace=True)


# In[41]:


global_carbon_budget.head(5)


# In[42]:


merged = merge.merge(global_carbon_budget, left_on = 'Year', right_on = 'Year')
global_data = merged
global_data.head(5)


# In[43]:


## comment: Terrestrial Sink + Land Sink (difference?)


# ## To CSV

# In[44]:


global_data.to_csv('data/data-out/globaldata_GCP.csv', encoding='utf-8')

# global_data is combined data from 
# global_carbon_budet
# ocean_sink
# terrestrial_sink 
# land_use_change


# # PER COUNTRY

# ## GCB

# ### 2019 National Emissions v1.0 

# In[45]:


df1 = pd.read_csv('data/openclimatedata/gcb/consumption-emissions.csv', sep=",", parse_dates=True) #header=0
df2 = pd.read_csv('data/openclimatedata/gcb/emissions-transfers.csv', sep=",", parse_dates=True)
df3 = pd.read_csv('data/openclimatedata/gcb/territorial-emissions.csv', sep=",", parse_dates=True)


# In[46]:


df1.head(3) 
df2.head(3) 
df3.head(3) 


# In[47]:


df3=df3.rename(columns={"Emissions": "territorial-emissions", "Source":"Source_territorial_emissions"})
df3.head(1)


# ### Merge

# In[48]:


national = df1.merge(df2, on=['Code', 'Year'])
national.head(5)


# In[49]:


national_emissions = national.merge(df3, on=['Code', 'Year'])
national_emissions.head(5)


# In[50]:


national_emissions.info() 


# ### To CSV

# In[51]:


national_emissions.to_csv('data/data-out/national_emissions_GCB.csv', encoding='utf-8')

# consumption-emissions
# emissions-transfers
# territorial-emissions


# ## EDGARv5.0

# In[52]:


# ef1 = fossil_CO2_totals_by_country      SHEET 1
# ef2 = fossil_CO2_per_capita_by_country  SHEET 3
# ef3 = fossil_CO2_per_GDP_by_country     SHEET 4
# ef4 = fossil_GHG_totals_by_country      SHEET 5
# ef5 = fossil_GHG_per_capita_by_country  SHEET 7
# ef6 = fossil_GHG_per_GDP_by_country     SHEET 8

# ef7 = fossil_CO2_by_sector_and_country  SHEET 2
# ef8 = fossil_GHG_by_sector_and_country  SHEET 6


# In[53]:


# CO2
# ef1 = fossil_CO2_totals_by_country      SHEET 1
ef1 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=1, skiprows=0, index_col=0)
# ef2 = fossil_CO2_per_capita_by_country  SHEET 3
ef2 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=3, skiprows=0)
# ef3 = fossil_CO2_per_GDP_by_country     SHEET 4
ef3 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=4, skiprows=0)

# GHG
# ef4 = fossil_GHG_totals_by_country      SHEET 5
ef4 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=5, skiprows=0)
# ef5 = fossil_GHG_per_capita_by_country  SHEET 7
ef5 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=7, skiprows=0)
# ef6 = fossil_GHG_per_GDP_by_country     SHEET 8
ef6 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=8, skiprows=0)

# Sectors
# ef7 = fossil_CO2_by_sector_and_country  SHEET 2
ef7 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=2, skiprows=0)
# ef8 = fossil_GHG_by_sector_and_country  SHEET 6
ef8 = pd.read_excel('./data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx', sheet_name=6, skiprows=0)


# In[54]:


fossil_CO2_totals_by_country     = ef1 
fossil_CO2_per_capita_by_country = ef2 
fossil_CO2_per_GDP_by_country    = ef3

fossil_GHG_totals_by_country     = ef4 
fossil_GHG_per_capita_by_country = ef5 
fossil_GHG_per_GDP_by_country    = ef6 

fossil_CO2_by_sector_and_country = ef7 
fossil_GHG_by_sector_and_country = ef8 


# In[55]:


ef1.head(1) 
ef2.head(1)
ef3.head(1) 

ef4.head(1)
ef5.head(1) 
ef6.head(1)

# Sector
ef7.head(1)
ef8.head(1)


# ## To JSON

# In[56]:


csvFilePath = "data/globaldata_GCP.csv"
jsonFilePath = "data/data-out/globaldata_GCP.json"

# data to dict
data = {}
with open(csvFilePath) as csvFile:
    csvReader = csv.DictReader(csvFile)
    
    for csvRow in csvReader:
        code = csvRow['Year']
        
        data[code] = csvRow
    

# Add data to root node

root= {}
root["global_data"] = data

with open(jsonFilePath, "w") as jsonFile:
        jsonFile.write(json.dumps(root, indent=4))
        print((json.dumps(root, indent=4)))


# In[57]:


csvFilePath = "data/edgar_combined.csv"
jsonFilePath = "data/data-out/edgar_combined.json"

# data to dict
data = {}
with open(csvFilePath) as csvFile:
    csvReader = csv.DictReader(csvFile)
    
    for csvRow in csvReader:
        code = csvRow['country_code']
        
        data[code] = csvRow
    

# Add data to root node

root= {}
root["edgar_combined"] = data

with open(jsonFilePath, "w") as jsonFile:
        jsonFile.write(json.dumps(root, indent=4))
        print((json.dumps(root, indent=4)))


# In[ ]:





# In[ ]:





# In[ ]:




