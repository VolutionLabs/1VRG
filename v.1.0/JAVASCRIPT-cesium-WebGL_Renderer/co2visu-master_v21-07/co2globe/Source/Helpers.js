
// Die Timeline manuell setzen: // ------------------------------------------------------------------------------------------------------------------------------------------

function onButtonStartClockClicked() {
    if (!_isClockRunning) {
        moveTimeSlider(); // 1x sofort ausführen
        _clockTimer = setInterval(moveTimeSlider, 800); // TODO wird hier immer wieder ein neues Objekt erzeugt?
        _isClockRunning = true;
    }
}
function onButtonStopClockClicked() {
    if (_clockTimer)
        clearInterval(_clockTimer);
    _isClockRunning = false;
}

function moveTimeSlider() {

    var currentTime = _viewer.clock.currentTime;
    var newTime = Cesium.JulianDate.addDays(currentTime, 365, new Cesium.JulianDate());

    if (newTime >= _viewer.clock.stopTime)
        newTime = _viewer.clock.startTime;

    _viewer.clock.currentTime = newTime;
}


// Kleine Hilfsfunktionen: // ------------------------------------------------------------------------------------------------------------------------------------------

// Kurz anhalten im Code
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// Debugging-Konsolen-Outputs : -----------------------------------------------------------------------------------------------------------

function onChangedViewerEntities(collection, added, removed, changed) {
    var msg = 'onChangedVIEWEREntites: Added ids: ------------------------------------------------------------------\n ';
    for (var i = 0; i < added.length; i++) {
        msg += ', ' + added[i].id;
    }
    msg += '\n Changed ids:';
    for (var i = 0; i < changed.length; i++) {
        msg += ', ' + changed[i].id;
    }
    console.log(msg + "\n\n");
}

function onChangedDataSourceEntities(collection, added, removed, changed) {
    var msg = 'onChangedDATASOURCEEntities: Added ids: ------------------------------------------------------------------\n ';
    for (var i = 0; i < added.length; i++) {
        msg += ', ' + added[i].id;
    }
    msg += '\n Changed ids:';
    for (var i = 0; i < changed.length; i++) {
        msg += ', ' + changed[i].id;
    }
    console.log(msg + "\n\n");
}

// Für Debugausgabe, wann die Entities geupdatet werden:
//_viewer.entities.collectionChanged.addEventListener(onChangedViewerEntities);

// sucht einen Wert in einem Baum
function findVal(obj, key) {
    var seen = new Set, active = [obj];
    while (active.length) {
        var new_active = [], found = [];
        for (var i = 0; i < active.length; i++) {
            Object.keys(active[i]).forEach(function (k) {
                var x = active[i][k];
                if (k === key) {
                    found.push(x);
                } else if (x && typeof x === "object" &&
                           !seen.has(x)) {
                    seen.add(x);
                    new_active.push(x);
                }
            });
        }
        if (found.length) return found;
        active = new_active;
    }
    return null;
}

function createHeatMapColor(value) {

    var ratio = value;

    // Color Schema von: https://www.dn.se/nyheter/grafik-det-nya-coronavirusets-utbredning-i-varlden/
    var rFunc = new Line2D();
    var gFunc = new Line2D();
    var bFunc = new Line2D();
    rFunc.setByTwoPoints(0.0, 255, 1.0, 115);
    gFunc.setByTwoPoints(0.0, 222, 1.0, 006);
    bFunc.setByTwoPoints(0.0, 222, 1.0, 021);

    var r = rFunc.getYbyX(ratio);
    var g = gFunc.getYbyX(ratio);
    var b = bFunc.getYbyX(ratio);
    var alpha = 0.8 * 255;

    var color = Cesium.Color.fromBytes(r, g, b, alpha);
    return color;
}
