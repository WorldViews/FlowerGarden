
// A garden with flowers representing Git repos for an organization
//
"use strict"

class MPlayer {
    constructor(opts) {
        opts = opts || {};
        console.log("**** MPlayer ****", opts);
        var instrument = opts.instrument || "taiko_drum";
        this.numNotesPlayed = 0;
        this.buffers = {};
        this.context = null;
        this.tStart = getClockTime();
        MIDI.loader = new sketch.ui.Timer;
        //this.loadInstrument("harpsichord");
        this.loadInstrument(instrument);
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
        MIDI.noteOn(0, i, 100);
        MIDI.noteOff(0, i, .1);
        this.numNotesPlayed += 1;
    }

    playMidiNote(i) {
        console.log("MidiPlayer.playMidiNote", i);
        MIDI.noteOn(0, i, 100);
        MIDI.noteOff(0, i, .1);
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
//
// based on example at https://codepen.io/Koenie/pen/qBEQJyK
//
var MMSG = null;

class MTool {
    constructor(midiBox) {
        this.midiBox = midiBox;
        this.midi = null;
        var inst = this;
        // start talking to MIDI controller
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({
                sysex: false
            }).then(md => inst.onMIDISuccess(md),
                () => inst.onMIDIFailure);
        } else {
            console.warn("No MIDI support in your browser")
        }
    }

    onMIDISuccess(midiData) {
        // this is all our MIDI data
        var inst = this;
        this.midi = midiData;
        var allInputs = this.midi.inputs.values();
        // loop over all available inputs and listen for any MIDI input
        for (var input = allInputs.next(); input && !input.done; input = allInputs.next()) {
            // when a MIDI value is received call the onMIDIMessage function
            input.value.onmidimessage = (data) => inst.onMIDImessage(data);
        }
    }

    // on failure
    onMIDIFailure() {
        console.warn("Not recognising MIDI controller")
    }

    onMIDImessage(message) {
        //console.log("midi msg", messageData);
        MMSG = message;
        var data = message.data;
        var midiId = data[0];
        var dsId = data[1];
        var vel = data[2];
        console.log("data: ", midiId, dsId, vel);
        var sound = "taiko";
        if (dsId == 42 || dsId == 51)
            sound = "cowbell";
        this.midiBox.onMidiMessage(midiId, dsId, vel, sound);
    }
}


class MidiBox extends Garden {
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
        this.mplayer = new MPlayer(opts);
        this.midiTool = new MTool(this);
        this.addItems();
    }

    onClick() {
        this.mplayer.playNote();
    }

    onMidiMessage(midiId, dsId, vel, sound) {
        if (vel != 64)
            this.mplayer.playMidiNote(dsId);
    }

    addItems() {
        var numItems = 10;
        console.log("addItems", numItems);
        var inst = this;
        var ncols = this.ncols;
        var spacing = this.spacing;
        var xLeft = this.x0 - (ncols - 1) * spacing / 2.0;
        var y0 = this.y0;
        var col, row;
        for (var i = 0; i < numItems; i++) {
            col = i % ncols;
            row = Math.floor(i / ncols);
            var name = "note" + i;
            console.log(row, col, "name:", name);
            var opts = { x: xLeft + col * spacing, y: y0 + row * spacing };
            opts.id = sprintf("xmidi%s", i);
            inst.gtool.addFlower(opts);
        }
        this.width = spacing * (ncols + 1) - spacing;
        this.height = spacing * (row + 1);
        this.x = this.x0;
        this.y = y0 + this.height / 2.0 - spacing + spacing / 4;
    }
}

window.MidiBox = MidiBox;
//# sourceURL=js/MidiBox.js
