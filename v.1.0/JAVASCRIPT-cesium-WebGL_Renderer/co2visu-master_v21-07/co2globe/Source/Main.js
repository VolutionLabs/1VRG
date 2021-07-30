
// Variablen: // ------------------------------------------------------------------------------------------------------------------------------------------

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNmUzNjVmYi0xMmYwLTQ4OGYtYWE4Ni1kOWVmYTMyYjgxZjgiLCJpZCI6MTIxNTEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjA0MjQ2NTB9.SFIxnAKR3VZOb2gmB16Pg91r4N3LaTC1mS-FUQSRuQs';

var _viewer;    // Das Cesium-Darstellungs-Objekt
var _lastUpdateDate; // letztes Datum / jahr in der Timeline, an dem ein Update war. Wird verwendet, damit man nicht zu oft die updateDataHeightAndColor Berechnung ausführt
var _targetSphereRadius; // Radius der großen Kugel. wird über einen Callback gesetzt, damit das Ändern des Radius nicht flickert

var _maxNumberOfDatasets = 1024; // maximale Anzahl der Datensätze, die geladen werden können
var _dataEntities = new Array(_maxNumberOfDatasets); // Array, das die verschiedenen Datensätze enthält
var _selectedDataIndex = 0; // momentan aktiver Index in dem Array _dataEntities - vom Nutzer ausgewählt
var _totalDataIndex = 0; // zweiter Index in dem Array _dataEntities - zu den Totals, für die Höhenanpassung der Polygondaten
var _dataSourceDisplays = new Array(_maxNumberOfDatasets); // Die Visualisierungen der Datensätze, werden geupdatet

var _dummyGlobalArgs = [[[0, 0], [0.05, 0], [0.05, 0], [0, 0.001], [-0.05, 0], [-0.05, 0], [0, -0.001]]];
var _dummyGeometryArgs = [[0]];

// Die "eigene" Uhr
var _clockTimer = null;
var _isClockRunning = false;

var _useColoring = true; // gibt an, ob man die Polygone einfärben möchte in Abhängigkeit der Datenwerte
var _extrusionsBaseHeight = 30000; // Basis-Höhe der Extrusionen in Metern

// Initialisierung: // ------------------------------------------------------------------------------------------------------------------------------------------

(function () {
    "use strict";

    console.log("Cesium.VERSION: " + Cesium.VERSION);

    // Erschaffe das Cesium Viewer Objekt:

    _viewer = new Cesium.Viewer('cesiumContainer',
	{
	    imageryProvider: Cesium.createWorldImagery({
	        style: Cesium.IonWorldImageryStyle.AERIAL
	    }),

        skyBox: false, // schalte den Sterne-Hintergrund aus

	    // Performance-Verbesserung ? ...: https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/
	    // Setzte dann auch : _viewer.scene.requestRender();
	    // requestRenderMode: true, // verbessert keine Performance, sorgt aber dafür, dass die deutschen Länder nur jedes 2.x geupdatet werden in den Balken und Labels?
	    // maximumRenderTimeChange: Infinity // Sekunden
	});

    /*// Wähle eine (gültige) Auswahl zum Start:
    _dataSelection_1.selectedIndex = 0;
    _dataSelection_2.selectedIndex = 2;
    _dataSelection_3.selectedIndex = 0;*/

    // Performance-Monitor:
    _viewer.scene.debugShowFramesPerSecond = true;

    //Seed the random number generator for repeatable results.
    // Cesium.Math.setRandomNumberSeed(0);

    // Lade die Daten für die Visualisierung: // ------------------------------------------------------------------------------------------------------------------------------------------

    loadDataFiles();

    // Die Timeline: // ------------------------------------------------------------------------------------------------------------------------------------------

    // Parametrisiere das Uhr-Modell
    var secsPerYear = 86400 * 365;
    _viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    _viewer.clock.startTime = Cesium.JulianDate.fromIso8601("1970-01-01");
    _viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2009-01-01");
    _viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2040-01-01");

    //_viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    _viewer.clock.clockStep = Cesium.ClockStep.TICK_DEPENDENT;

    var timeScale = 0.01;
    _viewer.clock.multiplier = secsPerYear * timeScale * 5;
    _viewer.animation.viewModel.setShuttleRingTicks([secsPerYear * timeScale, secsPerYear * timeScale * 5, secsPerYear * timeScale * 10, secsPerYear * timeScale * 50]);

    _viewer.animation.viewModel.dateFormatter = function (date, viewModel) {
        var gregorianDate = Cesium.JulianDate.toGregorianDate(date);
        return 'Year: ' + gregorianDate.year;
    };

    _viewer.animation.viewModel.timeFormatter = function (date, viewModel) {
        return ''; // löscht die Anzeige der Uhrzeit
    };


    // Das Aussehen der Timeline, von https://cesium.com/blog/2018/03/21/czml-time-animation/ 
    _viewer.timeline.makeLabel = function (date) {
        var gregorianDate = Cesium.JulianDate.toGregorianDate(date);
        return gregorianDate.year;
    };

    // Event Listener, jedes Mal wenn die Uhr getickt hat	
    _viewer.clock.onTick.addEventListener(updateDataHeightAndColor);

    // setup timeline
    function onTimelineScrub(e) {
        console.log("onTimelineScrub:");
        _viewer.clock.currentTime = e.timeJulian;
        // _viewer.clock.shouldAnimate = false; // das soll wohl das Laufen ausschalten
        updateDataHeightAndColor();
    }

    _viewer.timeline.addEventListener('settime', onTimelineScrub, false);
    _viewer.timeline.updateFromClock();
    _viewer.timeline.zoomTo(_viewer.clock.startTime, _viewer.clock.stopTime);

}());


