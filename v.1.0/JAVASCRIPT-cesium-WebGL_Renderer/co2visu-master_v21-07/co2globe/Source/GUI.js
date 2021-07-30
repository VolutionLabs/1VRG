
// GUI Elemente:

var _dataSelection_1 = document.getElementById('dataSelection_1');  // Dropdown-Liste der Auswahl der anzuzeigenden Daten, erste Hierarchiestufe
var _dataSelection_2 = document.getElementById('dataSelection_2');  // Dropdown-Liste der Auswahl der anzuzeigenden Daten, zweite Hierarchiestufe
var _dataSelection_3 = document.getElementById('dataSelection_3');  // Dropdown-Liste der Auswahl der anzuzeigenden Daten, dritte Hierarchiestufe
var _dataSelection_4 = document.getElementById('dataSelection_4');  // Dropdown-Liste der Auswahl der anzuzeigenden Daten, vierte Hierarchiestufe
var _dataSelection_5 = document.getElementById('dataSelection_5');  // Dropdown-Liste der Auswahl der anzuzeigenden Daten, fünfte Hierarchiestufe

// Die "Options" der 5 DataSelectionDropDowns
var _dsOpt_1 = _dataSelection_1.options;
var _dsOpt_2 = _dataSelection_2.options;
var _dsOpt_3 = _dataSelection_3.options;
var _dsOpt_4 = _dataSelection_4.options;
var _dsOpt_5 = _dataSelection_5.options;

var _checkboxBars = document.getElementById('bars');                             // Checkbox, ob die Daten per Balken angezeigt werden sollen
var _checkboxExtrusions = document.getElementById('extrusions');                 // Checkbox, ob die Daten per Länderumriss-Extrusionen angezeigt werden sollen
var _checkboxLogarithmicScaling = document.getElementById('logarithmicScaling'); // Checkbox, ob die Daten-Höhen logarithmisch dargestellt werden sollen

// Auswahl, welche Daten / Emissionen angezeigt werden sollen: // ------------------------------------------------------------------------------------------------------------------------------------------

function calculateIndex(si1, si2, si3, si4, si5) // selected indices 1-5
{
    return si1 * (_dsOpt_2.length * _dsOpt_3.length * _dsOpt_4.length * _dsOpt_5.length) +
    si2 * (_dsOpt_3.length * _dsOpt_4.length * _dsOpt_5.length) +
    si3 * (_dsOpt_4.length * _dsOpt_5.length) +
        si4 * _dsOpt_5.length +
        si5;
}

function setDataSelection() {

    updateDataSelectionAvailability();

    _selectedDataIndex = calculateIndex(_dataSelection_1.selectedIndex, _dataSelection_2.selectedIndex, _dataSelection_3.selectedIndex, _dataSelection_4.selectedIndex, _dataSelection_5.selectedIndex);

    if (_dataSelection_1.selectedOptions[0].value == "globe") {
        _totalDataIndex = _selectedDataIndex; // Bei den globalen Daten, für die Kugel, gibt es keine Polygone, die anders geupdatet werden müssen als die Balken
    }
    else {
        var optionsIndexTotal = -1;
        for (var i = 0; i < _dataSelection_5.options.length; i++) {
            if (_dataSelection_5.options[i].value == "total")
                optionsIndexTotal = i;
        }

        _totalDataIndex = calculateIndex(_dataSelection_1.selectedIndex, _dataSelection_2.selectedIndex, _dataSelection_3.selectedIndex, _dataSelection_4.selectedIndex, optionsIndexTotal);
    }

    console.log("Selected data index: " + _selectedDataIndex + ", totals: " + _totalDataIndex);

    _lastUpdateDate = 0; // damit auf jeden Fall ein Update ausgeführt wird!
    updateDataHeightAndColor();
}

// Wird aufgerufen, wenn die Dropdownboxen vom Nutzer betätigt wurden:

function setDataSelection_1() {

    setDataSelection();

    // Versuch: Auf die Daten "zoomen", die gerade gewählt wurden. Doch Cesium reagiert auf keinerlei Kommados hier!
    _viewer.flyTo(_dataSourceDisplays[_totalDataIndex].defaultDataSource);
    _viewer.zoomTo(_dataEntities[_totalDataIndex]);
}

function updateDataSelectionAvailability() {

    var idx, i1, i2, i3, i4, i5;

    // Dropdown 1: --------------------------------------------------------------------------------------------------------------------------------------------

    for (i1 = 0; i1 < _dsOpt_1.length; i1++) {

        _dsOpt_1[i1].disabled = true;

        for (i2 = 0; i2 < _dsOpt_2.length; i2++) {
            for (i3 = 0; i3 < _dsOpt_3.length; i3++) {
                for (i4 = 0; i4 < _dsOpt_4.length; i4++) {
                    for (i5 = 0; i5 < _dsOpt_5.length; i5++) {
                        idx = calculateIndex(i1, i2, i3, i4, i5);

                        if (_dataEntities[idx] != null)
                            _dsOpt_1[i1].disabled = false;
                    }
                }
            }
        }
    }

    // Sicherstellen, dass eine valide Auswahl getroffen wurde (Box 1) :

    if (_dsOpt_1[_dataSelection_1.selectedIndex].disabled) {
        _dataSelection_1.selectedIndex = 0;
        while (_dsOpt_1[_dataSelection_1.selectedIndex].disabled)
            _dataSelection_1.selectedIndex++;
    }

    // Dropdown 2: --------------------------------------------------------------------------------------------------------------------------------------------

    for (i2 = 0; i2 < _dsOpt_2.length; i2++) {

        _dsOpt_2[i2].disabled = true;

        for (i3 = 0; i3 < _dsOpt_3.length; i3++) {
            for (i4 = 0; i4 < _dsOpt_4.length; i4++) {
                for (i5 = 0; i5 < _dsOpt_5.length; i5++) {
                    idx = calculateIndex(_dataSelection_1.selectedIndex, i2, i3, i4, i5);

                    if (_dataEntities[idx] != null)
                        _dsOpt_2[i2].disabled = false;
                }
            }
        }
    }

    // Sicherstellen, dass eine valide Auswahl getroffen wurde (Box 2) :

    if (_dsOpt_2[_dataSelection_2.selectedIndex].disabled) {
        _dataSelection_2.selectedIndex = 0;
        while (_dsOpt_2[_dataSelection_2.selectedIndex].disabled)
            _dataSelection_2.selectedIndex++;
    }

    // Dropdown 3: --------------------------------------------------------------------------------------------------------------------------------------------

    for (i3 = 0; i3 < _dsOpt_3.length; i3++) {

        _dsOpt_3[i3].disabled = true;

        for (i4 = 0; i4 < _dsOpt_4.length; i4++) {
            for (i5 = 0; i5 < _dsOpt_5.length; i5++) {
                idx = calculateIndex(_dataSelection_1.selectedIndex, _dataSelection_2.selectedIndex, i3, i4, i5);

                if (_dataEntities[idx] != null)
                    _dsOpt_3[i3].disabled = false;
            }
        }
    }

    // Sicherstellen, dass eine valide Auswahl getroffen wurde (Box 3) :

    if (_dsOpt_3[_dataSelection_3.selectedIndex].disabled) {
        _dataSelection_3.selectedIndex = 0;
        while (_dsOpt_3[_dataSelection_3.selectedIndex].disabled)
            _dataSelection_3.selectedIndex++;
    }

    // Dropdown 4: --------------------------------------------------------------------------------------------------------------------------------------------

    for (i4 = 0; i4 < _dsOpt_4.length; i4++) {

        _dsOpt_4[i4].disabled = true;

        for (i5 = 0; i5 < _dsOpt_5.length; i5++) {
            idx = calculateIndex(_dataSelection_1.selectedIndex, _dataSelection_2.selectedIndex, _dataSelection_3.selectedIndex, i4, i5);

            if (_dataEntities[idx] != null)
                _dsOpt_4[i4].disabled = false;
        }
    }

    // Sicherstellen, dass eine valide Auswahl getroffen wurde (Box 4) :

    if (_dsOpt_4[_dataSelection_4.selectedIndex].disabled) {
        _dataSelection_4.selectedIndex = 0;
        while (_dsOpt_4[_dataSelection_4.selectedIndex].disabled)
            _dataSelection_4.selectedIndex++;
    }

    // Dropdown 5: --------------------------------------------------------------------------------------------------------------------------------------------

    for (i5 = 0; i5 < _dsOpt_5.length; i5++) {

        _dsOpt_5[i5].disabled = true;
        idx = calculateIndex(_dataSelection_1.selectedIndex, _dataSelection_2.selectedIndex, _dataSelection_3.selectedIndex, _dataSelection_4.selectedIndex, i5);

        if (_dataEntities[idx] != null)
            _dsOpt_5[i5].disabled = false;
    }

    // Sicherstellen, dass eine valide Auswahl getroffen wurde (Box 5) :
    if (_dsOpt_5[_dataSelection_5.selectedIndex].disabled) {
        _dataSelection_5.selectedIndex = 0;
        while (_dsOpt_5[_dataSelection_5.selectedIndex].disabled)
            _dataSelection_5.selectedIndex++;
    }

}

// Update nach Auswahl der Anzeige-Art (Balken/Extrusionen):
function setVisualizationMode() {
    _lastUpdateDate = 0; // damit auf jeden Fall ein Update ausgeführt wird!
    updateDataHeightAndColor();
}

// GUI-Eventhandler für Updates: // ------------------------------------------------------------------------------------------------------------------------------------------

_dataSelection_1.addEventListener('change', setDataSelection_1);
_dataSelection_2.addEventListener('change', setDataSelection);
_dataSelection_3.addEventListener('change', setDataSelection);
_dataSelection_4.addEventListener('change', setDataSelection);
_dataSelection_5.addEventListener('change', setDataSelection);

if (_checkboxBars)
    _checkboxBars.addEventListener('change', setDataSelection);
if (_checkboxExtrusions)
    _checkboxExtrusions.addEventListener('change', setDataSelection);
if (_checkboxLogarithmicScaling)
_checkboxLogarithmicScaling.addEventListener('change', setDataSelection);

