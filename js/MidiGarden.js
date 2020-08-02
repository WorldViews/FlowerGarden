
// A garden with flowers representing Git repos for an organization
//
"use strict"

class MPlayer {
    constructor(app) {
        console.log("**** SoundPlayer ****", app);
        this.numNotesPlayed = 0;
        this.buffers = {};
        this.context = null;
        this.tStart = getClockTime();
        MIDI.loader=new sketch.ui.Timer;
        //this.loadInstrument("harpsichord");
        this.loadInstrument("taiko_drum");
/*
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (this.AudioContext) {
            this.context = new this.AudioContext();
        }
*/
    }

    playNote(instName) {
        instName = instName || "taiko";
        console.log("MidiPlayer.playNote", instName);
        var i = 21 + this.numNotesPlayed % 20;
        if (instName == "cowbell") {
            i = 50;
        }
        MIDI.noteOn(  0, i, 100);
        MIDI.noteOff( 0, i,  .1);
        this.numNotesPlayed += 1;
    }

    loadInstrument(instr, successFn) {
        var instrument = instr;
        MIDI.loadPlugin({
            soundfontUrl: "/rhythm/soundfont/",
            instrument: instrument,
            onprogress: function (state, progress) {
                MIDI.loader.setValue(progress * 100);
            },
            onprogress: function (state, progress) {
                MIDI.loader.setValue(progress * 100);
            },
            onsuccess: function () {
                MIDI.programChange(0, instr);
                if (successFn)
                    successFn();
            }
        });
    }

}

class MidiGarden extends Garden {
    constructor(opts) {
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        opts.fillStyle = null;
        super(opts);
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.spacing = opts.spacing || 100;
        this.ncols = opts.ncols || 5;
        this.mplayer = new MPlayer();
        this.addFlowers();
    }

    onClick() {
        this.mplayer.playNote();
    }

    addFlowers(numFlowers) {
        numFlowers = 10;
        console.log("addFlowers", numFlowers);
        var inst = this;
        var ncols = this.ncols;
        var spacing = this.spacing;
        var xLeft = this.x0 - (ncols-1)*spacing/2.0;
        var y0 = this.y0;
        var col, row;
        for (var i=0; i<numFlowers; i++) {
            col = i % ncols;
            row = Math.floor(i / ncols);
            var name = "note"+i;
            console.log(row, col, "name:", name);
            var opts = { x: xLeft + col * spacing, y: y0 + row * spacing };
            opts.id = sprintf("xmidi%s", i);
            inst.gtool.addFlower(opts);
        }
        this.width = spacing * (ncols + 1) - spacing;
        this.height = spacing * (row + 1);
        this.x = this.x0;
        this.y = y0 + this.height / 2.0 - spacing + spacing/4;
    }
}

//# sourceURL=js/MidiGarden.js
