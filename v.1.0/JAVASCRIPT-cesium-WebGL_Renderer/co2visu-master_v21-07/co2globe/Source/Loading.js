
function loadDataFiles() {
    var i, j, k;
    var index = 0;
    var createCylinders, createSphere, isLocal;

    console.log("Trying to load " + (_dsOpt_1.length * _dsOpt_2.length * _dsOpt_3.length * _dsOpt_4.length * _dsOpt_5.length) + " files.");

    for (i1 = 0; i1 < _dsOpt_1.length; i1++) {
        for (i2 = 0; i2 < _dsOpt_2.length; i2++) {
            for (i3 = 0; i3 < _dsOpt_3.length; i3++) {
                for (i4 = 0; i4 < _dsOpt_4.length; i4++) {
                    for (i5 = 0; i5 < _dsOpt_5.length; i5++) {

                        var filename = _dsOpt_1[i1].value + "_" + _dsOpt_2[i2].value + "_" + _dsOpt_3[i3].value + "_" + _dsOpt_4[i4].value + "_" + _dsOpt_5[i5].value + ".topojson";

                        switch (_dsOpt_1[i1].value) {
                            case "country":
                                createCylinders = true;
                                createSphere = false;
                                isLocal = false;
                                break;
                            case "globe":
                                createCylinders = false;
                                createSphere = true;
                                isLocal = false;
                                break;
                            case "state":
                                createCylinders = true;
                                createSphere = false;
                                isLocal = true;
                                break;
                            default:
                        }

                        var loadPolygons = false;
                        if (_dsOpt_1[i1].value == "globe" || _dsOpt_5[i5].value == "total")
                            loadPolygons = true;

                        loadDataFile(filename, index, createCylinders, createSphere, isLocal, loadPolygons);

                        index++;
                    }
                }
            }
        }
    }
}


// Lade die anzuzeigenden Daten inkl. TopoJSON-Länderumrisse aus einer Datei. // ------------------------------------------------------------------------------------------------------------------------------------------
// isLocal: deutscher Datensatz
function loadDataFile(filename, indexInDataArray, createCylinders, createSphere, isLocal, loadPolygons) {

    var dataSourceCollection, dataSourceDisplay;

    if (loadPolygons) {

        dataSourceCollection = new Cesium.DataSourceCollection();

        dataSourceDisplay = new Cesium.DataSourceDisplay({
            scene: _viewer.scene,
            dataSourceCollection: dataSourceCollection
        });
    }

    $.getJSON('Source/Data/' + filename, function (json) {

        var entity, name, id, i = 0;

        if (!loadPolygons) //lösche Polygone wegen Speicherknappheit! 
        {
            if (json.arcs)
                json.arcs.length = 0;
            json.arcs = _dummyGlobalArgs;

            if (json.objects.collection.geometries) {
                for (var i = 0; i < json.objects.collection.geometries.length; i++) {
                    if (json.objects.collection.geometries[i].arcs) {
                        json.objects.collection.geometries[i].arcs.length = 0;
                        json.objects.collection.geometries[i].arcs = _dummyGeometryArgs;
                    }
                    if (json.objects.collection.geometries[i].type)
                        json.objects.collection.geometries[i].type = "Sphere";
                }
            }
        }

        var ds = new Cesium.GeoJsonDataSource();
        ds.load(json);

        // Füge die Daten hinzu: 
        if (loadPolygons)
            dataSourceCollection.add(ds);

        var dataEntities = ds.entities.values;

        dataEntities.isLocal = isLocal;
        dataEntities.groupMaxValue = 1;

        if (indexInDataArray == 320)
            var aa = 0;
        if (indexInDataArray == 328)
            var bb = 0;

        _dataEntities[indexInDataArray] = dataEntities;
        if (loadPolygons)
            _dataSourceDisplays[indexInDataArray] = dataSourceDisplay;

        // Für Debugausgabe, wann die Entities geupdatet werden:
        // dataSourceDisplay.dataSources._dataSources[0].entities.collectionChanged.addEventListener(onChangedDataSourceEntities);

        var jsonProperties = json.properties.attributes[Object.keys(json.properties.attributes)[0]]; // Wir wissen nicht, wie die Eigenschaft heisst, daher nehmen wir die erste Objekt-Property

        if (jsonProperties) {
            if (jsonProperties["measurements-units"]) {
                dataEntities.groupMaxValue = jsonProperties["measurements-units"]["group-max"];
            }
        }
        // Erschaffe die Extrusionen der Länder-Umrisse ("entity.polygon")

        {
            for (i = 0; i < dataEntities.length; i++) {
                entity = dataEntities[i];

                var color = Cesium.Color.fromRandom({
                    alpha: 0.80 // Transparenzwert der Extrusionen
                });

                if (entity.polygon) {

                    entity.polygon.material = color;
                    entity.polygon.outline = true;
                    entity.polygon.outlineColor = Cesium.Color.GREY;
                    entity.polygon.extrudedHeight = _extrusionsBaseHeight;
                    entity.polygon.outlineWidth = 10;
                    entity.polygon.arcType = Cesium.ArcType.GEODESIC;

                    entity.polygon.closeBottom = false;
                    entity.polygon.closeTop = true;

                }
                else {
                    //    console.log("Warning! Entity has no polygon!: " + entity.properties._name);
                }

                // So kann man die infoBox überschreiben und selber füllen:

                entity.description = "";
                if (entity.properties._name)
                    entity.description += ("name: " + entity.properties._name._value + "<br>");
                if (entity.properties._id)
                    entity.description += ("id: " + entity.properties.id._value + "<br>");
                if (entity.properties._code)
                    entity.description += ("code: " + entity.properties._code._value + "<br>");
                if (entity.properties._type)
                    entity.description += ("type: " + entity.properties._type._value + "<br>");
                entity.description += "<br>";

                if (jsonProperties) {

                    if (jsonProperties["measurements-units"]) {
                        // entity.description += ("unit: " + jsonProperties["measurements-units"].unit + "<br>");
                        entity.unit = jsonProperties["measurements-units"].unit;
                    }

                    if (jsonProperties["dataset-metadata"]) {
                        entity.description += ("data-source: " + jsonProperties["dataset-metadata"]["data-source"] + "<br>");
                        entity.description += ("dataset-description: " + jsonProperties["dataset-metadata"]["dataset-description"] + "<br>");
                        // entity.description += ("feature-name: " + jsonProperties["dataset-metadata"]["feature-name"] + "<br>");
                    }
                }
            }

            // Update all entities - does not update dynamic entities changes
            if (loadPolygons) {
                dataSourceDisplay.update(new Cesium.JulianDate());

                // Update all entities - Updates on any entity dynamic changes
                _viewer.clock.onTick.addEventListener(function (clock) {
                    // TODO Optimierung: reicht es, die 0 und 1 zu laden und hier zu refreshen?
                    _dataSourceDisplays.forEach(function (dataSourceDisplay) {
                        dataSourceDisplay.update(clock.currentTime);
                    })
                });
            }

            if (createCylinders) {

                // Erschaffe die Balken auf jedem Land:
                dataEntities.forEach(function (dataEntity) {

                    if (_viewer.entities.getById(dataEntity.properties.code._value) == null) {

                        var cylinderRadius = 20000 * 5; // globale Daten
                        if (isLocal)
                            cylinderRadius = 20000; // lokale Daten (dünner Zylinder-Radius)

                        var posFloor = Cesium.Cartesian3.fromDegrees(dataEntity.properties["center-lon"]._value, dataEntity.properties["center-lat"]._value, 0);

                        var ent = _viewer.entities.add(
                         {
                             id: dataEntity.properties.code._value,
                             name: dataEntity.properties.name._value,
                             description: dataEntity.description + "<br> (Balken-Beschreibung) <br>",

                             position: posFloor,

                             /*
                             cylinder: {
                                 length: 1000000,
                                 topRadius: cylinderRadius,
                                 bottomRadius: cylinderRadius,

                                 material: Cesium.Color.GREEN.withAlpha(0.9),
                                 // outline: true,
                                 outlineColor: Cesium.Color.DARK_RED,
                                 heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                 // shadows: Cesium.ShadowMode.ENABLED
                             },*/

                             polyline: {
                                 positions: [posFloor, posFloor],
                                 width: 5,
                                 material: Cesium.Color.GREEN.withAlpha(0.9),
                             },

                             label: {
                                 text: dataEntity.properties.name,
                                 font: '10pt monospace',
                                 style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                 showBackground: true,
                                 outlineWidth: 2,
                                 distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 7000000.0),
                                 eyeOffset: new Cesium.Cartesian3(0, 0, -3 * cylinderRadius)  // x points towards the viewer's right, y points up, and z points into the screen; meters
                             }
                         });
                    }
                });
            }
            if (createSphere) {

                // Erschaffe eine Kugel ("ellipsoid") um die Erde:
                dataEntities.forEach(function (dataEntity) {
                    if (_viewer.entities.getById(dataEntity.properties.code._value) == null) {

                        var innerCoreRadius = 1250000 * 7;

                        var sphere = _viewer.entities.add(
                         {
                             id: dataEntity.properties.code._value,
                             name: dataEntity.properties.name._value,
                             position: new Cesium.Cartesian3(0.1, 0.1, 0.1), // Cesium.Cartesian3.ZERO, // Zero crashes
                             description: dataEntity.description + "<br> (Sphere-Beschreibung) <br>" + "I am your whole Earth-Ball !!! <br> Help me, the humans are killing me.",

                             ellipsoid: {
                                 radii: new Cesium.CallbackProperty(currentSphereRadius, false), // Callback damit nicht flackert
                                 material: Cesium.Color.YELLOW.withAlpha(0.5),
                             },
                         });
                    }
                });
            }
        }

        _lastUpdateDate = 0; // damit auf jeden Fall ein Update ausgeführt wird!
        updateDataHeightAndColor();

        updateDataSelectionAvailability();

    }).fail(function (jqxhr, textStatus, error) {
        // Display any errors encountered while loading.
        // console.log("Could not load file: " + JSON.stringify(error));
    })
};

