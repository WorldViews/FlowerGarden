
// A garden with flowers representing Git repos for an organization
//
"use strict"

class PianoKey extends CanvasTool.RectGraphic {
    onClick() {
        this.pianoBox.mplayer.playMidiNote(this.midiId);
        return true;
    }
}

class PianoBox extends MidiBox {
    constructor(opts) {
        opts = opts || {};
        opts.instrument = "harpsichord";
        opts.instrument = "acoustic_grand_piano";
        super(opts);
        this.fillStyle = "salmon";
        var inst = this;
        PLAYER.midiPrefix = "/rhythm/midi/";
        PLAYER.setupTrackInfo();
        PLAYER.loadInstrument("acoustic_grand_piano");
        PLAYER.startUpdates();
        this.startSong();
        PLAYER.noteObserver = (ch, pitch, v, dur, t) => this.observeNote(ch,pitch, v, dur, t);
    }

    onClick() {};

    startSong() {
        PLAYER.playMelody("Bach/wtc0")
    }

    observeNote(channel, pitch, vel, t, dur) {
        var inst = this;
        //console.log("play note", channel, pitch, vel, dur, t);
        var i = pitch - 40;
        let key = this.keys[i];
        if (!key) {
            console.log("no note for", pitch);
            return;
        }
        key.fillStyle = key.highlightColor;
        setTimeout(() => {
            //console.log("set style", i, prevStyle);
            key.fillStyle = key.color;
        }, dur*1000)    ;   
    }

    highlightKey() {

    }

    async addItems() {
        await requirePackage("Taiko");
        console.log("TaikoBox.addItems");
        var opts = { x: this.x, y: this.y, id: "taikobox1" };
        var numKeys = 50;
        var whiteKeyWidth = 18;
        var blackKeyWidth = 12;
        var spacing = 20;
        var x0 = this.x - numKeys * spacing / 3.3;
        var pattern = ["white", "black", "white", "black", "white", "black", "white",
            "white", "black", "white", "black", "white"]
        var x = x0;
        var prevColor = null;
        var id;
        var bkeys = [];
        var wkeys = [];
        this.keys = [];
        for (var i = 0; i < numKeys; i++) {
            var j = i % 12;
            var color = pattern[j];
            if (color == prevColor)
                x += spacing;
            else
                x += spacing / 2;
            prevColor = color;
            var opts;
            var key;
            if (color == "white") {
                id = "wkey" + i;
                opts = {
                    id, x, y: this.y, width: whiteKeyWidth, height: 100,
                    lineWidth: 1, fillStyle: color, strokeStyle: "black"
                };
                key = new PianoKey(opts);
                key.color = color;
                key.highlightColor = "pink";
                wkeys.push(key);
            }
            else {
                id = "bkey" + i;
                opts = {
                    id, x, y: this.y -30, width: blackKeyWidth, height: 50,
                    lineWidth: 1, fillStyle: color, strokeStyle: "black"
                };
                key = new PianoKey(opts);
                key.color = color;
                key.highlightColor = "brown";
                bkeys.push(key);
            }
            key.midiId = i+40;
            key.pianoBox = this;
            this.keys.push(key);
            //this.gtool.addGraphic(key);
        }
        var gtool = this.gtool;
        wkeys.forEach(key => gtool.addGraphic(key));
        bkeys.forEach(key => gtool.addGraphic(key));
        this.width = x - x0 + 2*spacing;
    }
}


//# sourceURL=js/TaikoBox.js
