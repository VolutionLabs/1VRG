
class Line2D {

    constructor() {
        this._m = 0;
        this._b = 0;
        this._isVertical = false;
    }

    setByTwoPoints(x1, y1, x2, y2) {

        // kopiert aus Autocalib: C2DLine::CreateByTwoPoints(double x1, double y1, double x2, double y2)
        // Die zwei Stützpunkte ergeben eine Gerade mit y = m*x+b mit m = (y1-y2)/(x1-x2) und b = y1 - m * x1

        // Gerade: https://www.arndt-bruenner.de/mathe/9/geradedurchzweipunkte.htm
        //      y2-y1      x2*y1 - x1* y2
        // y = ——————·x + ——------——————
        //     x2 - x1         x2 - x1

        if (x1 == x2) // Spezialfall vertikale Gerade
        {
            this._isVertical = true;
            this._m = 999;
            this._b = x1;
        }
        else // normale Gerade
        {
            this._isVertical = false;
            this._m = (y1 - y2) / (x1 - x2);
            this._b = y1 - this._m * x1;
        }
    }

    getYbyX(x) {
        if (this._isVertical == false)
            return this._m * x + this._b;
        else
            return 0;
    }

}

