
// Berechnet für den aktuell gewählten Zeitpunkt, welcher Wert (wie groß) aus dem DatenaArray anzuzeigen ist // ------------------------------------------------------------------------------------------------------------------------------------------
function interpolateDataValue(currentTime, timeSeries) {

    var isDebug = false;

    if (isDebug) console.log("currentTime: " + currentTime);
    var gregorianDate = Cesium.JulianDate.toGregorianDate(currentTime);
    if (isDebug) console.log("gregorianDate: " + gregorianDate);

    // Simpel und schnell: nimm einfach das Jahr

    var data = null;

    var dataArray = timeSeries[Object.keys(timeSeries)[0]]; // Wir wissen nicht, wie die Timeseries heisst, daher nehmen wir die erste Objekt-Property als Timeseries

    if (dataArray)
        data = dataArray[gregorianDate.year];
    else
        console.log("Warning! dataArray is null!");
    if (data)
        return data;

    // Komplizierter und langsamer: Interpolation und Randbehandlung:

    /*
    // for (var i = 0; i < dataArray.length; i++) {
    for (var i = 1970 - 5; i < 2019 + 5; i++) {
        if (isDebug) console.log("i: " + i);
        var data = dataArray[i];
        if (data != null && data != "") {
            if (isDebug) console.log("data: " + data);
            var offset = currentDate - i;
            if (isDebug) console.log("offset: " + offset);
            if (offset >= 0.0 && offset <= 1.0) {
                var val;
                // TODO interpoliere, wenn innere Werte fehlen
                if (i == dataArray.length - 1 || dataArray[i + 1] == null || dataArray[i + 1] == "") // Wir sind schon ganz hinten im Array, es gibt keinen Nachbarn rechts
                    val = data.value; // Clampe die Interpolation
                else {
                    val = (1.0 - offset) * data + offset * dataArray[i + 1]; // Berechnung der Interpolation
                    if (isDebug) console.log("data " + data);
                    if (isDebug) console.log("dataArray[i+1]" + dataArray[i + 1]);
                }
                if (isDebug) console.log("returnING " + val);
                return val;
            }
        }
    };*/

    if (isDebug) console.log("ERROR: interpolateDataValue error: Not found.");
    return null;
};

// Aktualisiert den Zustand, welche Objekte (Balken, Extrusionen, ....) gerade angezeigt werden sollen // ------------------------------------------------------------------------------------------------------------------------------------------
function updateDataVisibility() {

    // Erstmal die Sichtbarkeit für alle Objekte ausschalten:

    _viewer.entities.values.forEach(function (viewerEntity) {
        if (viewerEntity != null && viewerEntity.show)
            viewerEntity.show = false;
    });

    _dataEntities.forEach(function (dataEntities) {
        dataEntities.forEach(function (entity) {
            if (entity./*polygon.*/show)
                entity./*polygon.*/show = false;
        });
    });

    // Dann die gewünschten Objekte sichtbar schalten:

    if (_dataEntities != null && _dataEntities[_totalDataIndex] != null) {
        _dataEntities[_totalDataIndex].forEach(function (entity) {
            var viewerEntity = _viewer.entities.getById(entity.properties.code._value);

            if (viewerEntity != null) {
                if (_checkboxBars)
                    viewerEntity.show = _checkboxBars.checked;
                else
                    viewerEntity.show = true;
            }

            if (_checkboxExtrusions)
                entity.show = _checkboxExtrusions.checked;
            else
                entity.show = true;
        });
    }
}

// Aktualisert den Zustand, welche Höhe die Objekte (Balken, Extrusionen, ...) aktuell haben müssen // ------------------------------------------------------------------------------------------------------------------------------------------
function updateDataHeightAndColor() {

    var gregorianDate = Cesium.JulianDate.toGregorianDate(_viewer.clock.currentTime);

    if (gregorianDate.year == _lastUpdateDate)
        return; // Nichts machen, es ist nicht genug Zeit auf der Timeline vergangen - es ist noch dasselbe Jahr

    _lastUpdateDate = gregorianDate.year;
    console.log("updateDataHeightAndColor:" + _viewer.clock.currentTime);

    var suspendEvents = true;

    if (suspendEvents) {
        // Schalte Rendering/Update aus
        _viewer.entities.suspendEvents();
        _dataSourceDisplays.forEach(function (dataSourceDisplay) {
            dataSourceDisplay.dataSources._dataSources[0].entities.suspendEvents();
        });
    }

    updateDataVisibility();

    updateGeometryProperties(_totalDataIndex, true, false, false);
    updateGeometryProperties(_selectedDataIndex, false, true, true);

    if (suspendEvents) {
        // Schalte Rendering/Update ein
        _viewer.entities.resumeEvents();
        _dataSourceDisplays.forEach(function (dataSourceDisplay) {
            dataSourceDisplay.dataSources._dataSources[0].entities.resumeEvents();
        });
    }

    // Explicitly render a new frame
    //_viewer.scene.requestRender();
};

function updateGeometryProperties(dataIndex, updatePolygons, updateBars, updateSphere) {

    var valueScaled = 0;

    if (_dataEntities[dataIndex] != null) {
        _dataEntities[dataIndex].forEach(function (entity) {
            if (entity.properties.timeseries) {
                var value = interpolateDataValue(_viewer.clock.currentTime, entity.properties.timeseries._value);

                if (_checkboxLogarithmicScaling && _checkboxLogarithmicScaling.checked) {
                    // Logarithmische Anzeige
                    // valueScaled = Math.log10(value) / Math.log10(_dataEntities[dataIndex].groupMaxValue); // Wert ist nun zwischen 0.0 und 1.0;
                    valueScaled = Math.sqrt(value) / Math.sqrt(_dataEntities[dataIndex].groupMaxValue); // Wert ist nun zwischen 0.0 und 1.0;
                }
                else // normale, lineare Anzeige
                {
                    var valueScaled = value / _dataEntities[dataIndex].groupMaxValue; // Wert ist nun zwischen 0.0 und 1.0;
                }

                valueScaled = Math.min(Math.max(0, valueScaled), 1); // Clamp zur Sicherheit
                var color = createHeatMapColor(valueScaled); // Wert ist zwischen 0.0 und 1.0;
                valueScaled *= (6371 * 1000 / 2.0); // Maximalwert in Metern, z.B. Erdradius: 6371*1000

                // TODO: negative Werte mit Farbe anzeigen?
                if (valueScaled < 0)
                    valueScaled = -valueScaled;

                var alpha = 0.9 * 255; // Transparenzwert der Polygone

                var colorInactive = Cesium.Color.fromBytes(127, 127, 127, alpha);
                var valueInactive = _extrusionsBaseHeight * 1.3;

                if (value == null || value == 0)  // Keine Daten vorhanden 
                    valueScaled = valueInactive;

                valueScaled = Math.max(valueScaled, valueInactive); // Die Balken werden nie kleiner als die (sich nicht in der Höhe ändernden) Extrusionen, damit sie anklickbar bleiben

                // setze Höhe der Länder-Extrusion
                if (updatePolygons && entity.polygon != null && entity.polygon.extrudedHeight != null && entity.show) {
                    // entity.polygon.extrudedHeight = valueScaled;
                    if (value == null || value == 0) { // Keine Daten vorhanden -> inaktiv darstellen
                        if (_useColoring)
                            entity.polygon.material = colorInactive;
                    }
                    else {
                        if (_useColoring)
                            entity.polygon.material = color;
                    }
                }

                // setze Höhe des Balkens / der Kugel

                var viewerEntity = _viewer.entities.getById(entity.properties.code._value);
                if (viewerEntity != null) {
                    if (viewerEntity.show) {

                        if (updateBars) {
                            if (viewerEntity.cylinder) {
                                if (value == null || value == 0) { // Keine Daten vorhanden -> inaktiv schalten
                                    viewerEntity.cylinder.length = valueScaled;
                                    if (_useColoring) {
                                        viewerEntity.cylinder.material = colorInactive;
                                    }
                                }
                                else {
                                    if (_useColoring)
                                        viewerEntity.cylinder.material = color;
                                }
                            }

                            if (viewerEntity.polyline) {

                                var posFloor = Cesium.Cartesian3.fromDegrees(entity.properties["center-lon"]._value, entity.properties["center-lat"]._value, 0);
                                var posTop = Cesium.Cartesian3.fromDegrees(entity.properties["center-lon"]._value, entity.properties["center-lat"]._value, valueScaled);

                                viewerEntity.polyline.positions = [posFloor, posTop];

                                if (value == null || value == 0) { // Keine Daten vorhanden -> inaktiv schalten
                                    if (_useColoring) {
                                        //viewerEntity.polyline.material = colorInactive;
                                    }
                                }
                                else {
                                    if (_useColoring) {
                                        //viewerEntity.polyline.material = color;
                                    }
                                }
                            }

                            if (viewerEntity.label) {
                                var gregorianDate = Cesium.JulianDate.toGregorianDate(_viewer.clock.currentTime);

                                var valueToDisplay;
                                if (value != null)
                                    valueToDisplay = value.toFixed(2);
                                else
                                    valueToDisplay = "???";

                                viewerEntity.label.text._value = viewerEntity.name + ": " + valueToDisplay + " " + entity.unit + " (" + gregorianDate.year + ")";
                            }

                        }

                        if (updateSphere) {
                            if (viewerEntity.ellipsoid) {
                                var radius = 6371000 + valueScaled; // Erdradius plus Wert
                                _targetSphereRadius = new Cesium.Cartesian3(radius, radius, radius);

                                if (value == null || value == 0) {  // Keine Daten vorhanden -> inaktiv schalten                                   
                                    if (_useColoring)
                                        viewerEntity.ellipsoid.material = colorInactive;
                                }
                                else {
                                    if (_useColoring)
                                        viewerEntity.ellipsoid.material = color;
                                }
                            }
                        }
                    }
                }
                else
                    console.log("viewerEntity not found!: " + entity.properties.code._value);
            }
        });
    }
}




// Callback für das Setzen des Kugelradius ohne Flickern
function currentSphereRadius() {
    console.log("currentSphereRadius()");

    return _targetSphereRadius;
}
