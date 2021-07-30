# emissions-topojson

TopoJSON creator for climate emissions data

Takes a raw topojson file with a dataset of area geometries (countries, states,...), iterates through them and enriches timeseries data from separate attribute data CSV and XLSX files.


## Execution

Run on commandline with `python3 topojson.py`

## Configuration

### data-config.json

The files `data-config-*.json` contain an overview of feature types that will be processed including their metadata.
Names of the feature types must be unique.
Additional `data-config-*.json` files can be created and must be referenced in `settings.json` as `dataConfigFile` for processing.

For each feature type, there is a part `reference`, `metadata` and `settings`. The `reference` list contains information about which dataset to process.

Available reference parameters:

| reference parameter | description | example | mandatory |
| ------ | ------ | ------ | ------ |
| `file` | file path relative to project root | "file":"data/EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx" | yes |
| `sheetname` | name of the sheet to process |"sheetname":"fossil_CO2_by_sector_and_countr" | yes for xls(x) files |
| `area-column` | name of the column referencing country names | "area-column":"name" | yes for files with country codes |
| `year-column` | name of the column referencing the timeseries years | "year-column":"name" | yes for csv with inverted structure |
| `value-column` | name of the column referencing domain values | "value-column":"name" | yes for csv with inverted structure |
| `restrict-where` | only process rows where this condition is met; key= column name, value = cell value | "Sector=Transport" | no |
| `skipInitialRows` | number of rows to skip at beginning of file; default=0 if omitted | 1 | no |
| `readRowsUntil` | count of row to finish reading at; default=read all lines | 22 | no |

The `metadata` list will be taken as-is and added to the output topojson properties.
The `settings` sublist contains parameter to influence the processing of the dataset, e.g. parameters that influence output naming.

### Script execution parameters

Additional script execution parameters are defined in `settings.json`.
If in `settings.json` the adminLevel parameter is defined, only datasets from this adminLevel will be processed.
The parameter `data` contains the adminLevels with their respective data-config.json files that will be used for processing the correct feature types.

Available processing parameters:

| parameter | description | example | mandatory |
| ------ | ------ | ------ | ------ |
| `featuretypeToProcess` | The feature type from data-config.json to process. Use empty string to process all feature types. | - | yes |
| `dataConfigFile` | Path to the config file with feature types and their metadata | - | yes |
| `topojsonRawFile` | Path to the input topojson file with base structure | - | yes |
| `centerCoordinatesFile` | Path to the file with countries and their center coordinates | - | no |
| `countriesCSV` | Path to the file with world countries and their ISO codes | - | yes for processing world countries datasets |
| `countriesCSVcustom` | Path to the file with custom definitions of world countries and their ISO codes | - | no |
| `timeSeriesStartYear` | Start year for timeseries data | 1970 | yes |
| `timeSeriesEndYear` | End year for timeseries data | 2020 | yes |
| `useIsoCodeMatching` | Should be True for processing world countries, otherwise False | True | yes |
| `useCustomISOCodeMatching` | Should be True to match countries with non-standard naming in input data | True | yes for processing world countries datasets |
| `readAreaCenterCoordinates` | Add center coordinates to output. Should be True for world countries datasets. centerCoordinatesFile must be available. | Default=False | yes |
| `iso3CountryColumn` | Column in file countriesCSV with ISO country codes. | 'official_name_en' | yes |
| `iso3CustomCountryColumn` | Column in file countriesCSVcustom with ISO country codes | 'official_name_en' | yes, when countriesCSVcustom is used |
| `joinColumn` | Column in the ISO codes file, that defines the area code to link to the topojson output.  | ISO3166-1-Alpha-3 | yes |
| `joinCustomColumn` | Column in the custom ISO codes file, that defines the area code to link to the topojson output.  | ISO3166-1-Alpha-3 | yes, when countriesCSVcustom is used |
| `topojsonJoinProperty` | Property in the raw topojson file that defines the area code for a geometry.  | ISO_A3 | yes |
| `centerCoordsJoinColumn` | Column name in the centerCoordinatesFile, that defines the match column (e.g. geometry code or name).  | country_code | yes |
| `csvEncoding` | Encoding to use for reading csv files.  | 'utf-8', 'cp1252' | yes |
| `prettyPrintOutput` | Try to pretty print topojson output. Default=False for minimized output size. | True | yes |
| `verbose` | Turns on verbose logging. Default=False | True | yes |
| `debugISOCountry` | Extended debug logging for a specific area, e.g. GER; verbose must be True. Default=False | False | yes |
| `writeAllFeatureTypesToSingleFile` | Append all processed feature types to the first output file that is created. | True | no |

## Domain data structure

Expected default structure is a document with all area names or codes in one column and multiple columns with data for each year, see `EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx`.

Example default structure:

| country name | 1970 | 1971 | 1972 |
| ------ | ------ | ------ | ------ |
| Afghanistan | 0.000 | 0.001 | 0.002 |
| Albania | 0.001 | 0.002 | 0.003 |

For some datasets, the structure is inverted, that is, one column contains all years and the other columns contain data for each feature type.
If this is the case, it is indicated by the param `year-column` in the `data-config.json` file description and the data array will be
inverted by the converter automatically to correspond to the expected default structure.

Example inverted structure:

| Year | Terrestrial-Sink | Ocean-Sink | Land-Use-Change |
| ------ | ------ | ------ | ------ |
| 1970 | 0.000 | 0.001 | 0.002 |
| 1971 | 0.001 | 0.002 | 0.003 |

## Data sources

### world-countries

`countries-raw.topojson`
- contains the static origin topojson structure of the world countries
- generated from ne_110m_admin_0_countries.shp using mapshaper.org

`wlt-centers.csv`
- contains the countries center coordinates

`country-iso-codes.csv`
- contains official ISO3 country codes and country names in english
- https://pkgstore.datahub.io/core/country-codes/country-codes_csv/data/3b9fd39bdadd7edd7f7dcee708f47e1b/country-codes_csv.csv
- license: https://www.opendatacommons.org/licenses/pddl/1.0/

`country-iso-codes-edgecases.csv`
- contains ISO3 country codes with custom country naming as it is used in the input domain data files
- can be extended manually for custom country names used in the datasets to process

`EDGARv5.0_FT2018_fossil_CO2_GHG_booklet2019.xlsx`
- world climate emissions timeseries data

`consumption-emissions.csv`
- world climate emissions timeseries data

`emissions-transfers.csv`
- world climate emissions timeseries data

`territorial-emissions.csv`
- world climate emissions timeseries data

### germany-states

`states-raw.topojson`
- contains the static origin topojson structure of the german states
- generated from http://opendatalab.de/projects/geojson-utilities/

`e_5.1.1.xlsx`
- data of greenhouse gas emissions for the federal german states

`e_5.1.2.xlsx`
- data of greenhouse gas emissions per capita for the federal german states

`e_5.2.1.xlsx`
- data of carbon emissions for the federal german states

`bund-centers.csv`
- contains the german states center coordinates

### global

`surface-raw.topojson`
- contains the static origin topojson structure for the world sphere
- generated manually based on the previous topojson structure
- does not contain a sphere geometry since it will be displayed incompletely by some client programs

`fossil-fuel-cement-per-capita.csv`
- timeseries data

`fossil-fuel-cement.csv`
- timeseries data

`historical-budget.csv`
- timeseries data containing multiple emission and sink variables


## Output datasets

The converter produces one .topojson file for each feature type in the folder /data/out.
If the option `writeAllFeatureTypesToSingleFile` is used, all processed feature types will be appended to the first topojson file produced.
