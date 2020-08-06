
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
        //this.player = PLAYER;
        this.player = new MidiPlayTool();
        window.MPLAYER = this.player;
        var player = this.player;
        player.midiPrefix = "/rhythm/midi/";
        //player.scene = this;
        this.notes = [];
        player.setupTrackInfo();
        player.loadInstrument("acoustic_grand_piano");
        player.startUpdates();
        player.noteObserver = (ch, pitch, v, dur, t) => this.observeNote(ch,pitch, v, dur, t);
    }

    draw(canvas, ctx) {
        super.draw(canvas, ctx);
        //console.log("Adding note graphics...");
        var player = this.player;
        var midiTrack = player.midiObj;
        if (!midiTrack)
            return;
        var pt = this.player.getPlayTime();
        var groups = midiTrack.seq;
        //ctx.strokeStyle = null;
        this.clipNotes = true;
        if (this.clipNotes) {
            ctx.rect(this.x-this.width/2, this.y-this.height/2, this.width, this.height);
            ctx.stroke();
            ctx.clip();
        }
        //console.log("pt", pt);
        for (var i = 0; i < groups.length; i++) {
            //console.log("eventGroup i");
            var eventGroup = groups[i];
            var t0 = eventGroup[0];
            var events = eventGroup[1];
            for (var k = 0; k < events.length; k++) {
                var event = events[k];
                if (event.type != "note")
                    continue;
                var note = event;
                var pitch = note.pitch;
                var v = note.v;
                //var dur = note.dur/player.ticksPerBeat;
                var dur = note.dur / player.ticksPerSec;
                var t = (t0 / player.ticksPerSec) - pt;
                //console.log(t0+" graphic for note pitch: "+pitch+" v:"+v+" dur: "+dur);
                //console.log("draw note", t, dur, pitch);
                var ki = pitch - 40;
                let key = this.keys[ki];
                if (!key) {
                    //console.log("no key", i);
                    continue;
                }
                var heightPerSec = 50;
                var dx = 10;
                //console.log("addNote", t, dur, pitch);
                var x = key.x;
                var y = this.y + 55 + t*heightPerSec;
                var h = dur*heightPerSec;
                var w = 6;
                ctx.lineWidth = 1;
                ctx.fillStyle = "green";
                ctx.beginPath();
                //if (this.fillStyle)
                //    ctx.fillRect(x - w / 2, y - h / 2, w, h);
                ctx.fillRect(x - w / 2, y, w, h);
                ctx.stroke();        
                //this.drawRect(canvas, ctx, x, y, nwidth, height);
            }
        }   
    }

    clearNotes() {
        console.log("clear notes");
    }

    addNote(t, dur, pitch) {
        return;
        var i = pitch - 40;
        let key = this.keys[i];
        if (!key) {
            console.log("no key", i);
            return;
        }
        var heightPerSec = 50;
        var dx = 10;
        console.log("addNote", t, dur, pitch);
        var x = key.x;
        var y = this.y + 20 + t*heightPerSec;
        var height = dur*heightPerSec;
        var note = new CanvasTool.RectGraphic({x, y, height, width: 6})
        this.notes.push(note);
        this.gtool.addGraphic(note);
    }

    onClick() {
        if (!this.started)
            this.startSong();
    };

    startSong() {
        this.started = true;
        this.player.playMelody("Bach/wtc0")
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
        var numKeys = 48;
        var whiteKeyWidth = 18;
        var blackKeyWidth = 12;
        var spacing = 20;
        var x0 = this.x - numKeys * spacing / 3.3;
        this.xkey0 = x0;
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


//# sourceURL=js/PianoBox.js
