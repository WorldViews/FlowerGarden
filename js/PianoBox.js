
// A garden with flowers representing Git repos for an organization
//
"use strict"

class PianoKey extends CanvasTool.RectGraphic {
    onClick() {
        this.pianoBox.mplayer.playMidiNote(this.midiId);
    }
}

class PianoBox extends MidiBox {
    constructor(opts) {
        opts = opts || {};
        opts.instrument = "harpsichord";
        opts.instrument = "acoustic_grand_piano";
        super(opts);
    }

    async addItems() {
        await requirePackage("Taiko");
        console.log("TaikoBox.addItems");
        var opts = { x: this.x, y: this.y, id: "taikobox1" };
        var numKeys = 40;
        var whiteKeyWidth = 18;
        var blackKeyWidth = 12;
        var spacing = 20;
        var x0 = this.x - numKeys * spacing / 2;
        var pattern = ["white", "black", "white", "black", "white", "black", "white",
            "white", "black", "white", "black", "white"]
        var x = x0;
        var prevColor = null;
        var id;
        for (var i = 0; i < numKeys; i++) {
            var j = i % 12;
            var color = pattern[j];
            if (color == prevColor)
                x += spacing;
            else
                x += spacing / 2;
            var opts;
            if (color == "white") {
                id = "wkey" + i;
                opts = {
                    id, x, y: this.y, width: whiteKeyWidth, height: 100,
                    lineWidth: 1, fillStyle: color, strokeStyle: "black"
                };
            }
            else {
                id = "bkey" + i;
                opts = {
                    id, x, y: this.y -30, width: blackKeyWidth, height: 50,
                    lineWidth: 1, fillStyle: color, strokeStyle: "black"
                };
            }
            var key = new PianoKey(opts);
            key.midiId = i+40;
            key.pianoBox = this;
            this.gtool.addGraphic(key);

        }
    }
}


//# sourceURL=js/TaikoBox.js
