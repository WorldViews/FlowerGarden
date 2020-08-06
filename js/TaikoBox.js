
// A garden with flowers representing Git repos for an organization
//
"use strict"

class TaikoBox extends MidiBox {

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
        player.loadInstrument("taiko_drum");
        player.startUpdates();
        player.noteObserver = (ch, pitch, v, dur, t) => this.observeNote(ch,pitch, v, dur, t);
    }

    observeNote(ch, pitch, v, dur, t) {
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
        var ystrike = this.y + 60;
        this.drawPolyLine(canvas, ctx,
            [{x: this.x-100, y: ystrike}, {x: this.x+100, y: ystrike}]);
        ctx.save();
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
                let target = this.targets[0];
                if (ki > 20)
                    target = this.targets[1];
                if (!target) {
                    //console.log("no key", i);
                    continue;
                }
                var heightPerSec = 50;
                var dx = 10;
                //console.log("addNote", t, dur, pitch);
                var x = target.x + 2*ki;
                var y = ystrike + t*heightPerSec;
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
        ctx.restore();
    }

    onClick() {
        if (!this.started) {
            //this.startSong();
            this.playMySong();
        }
    };


    async playMySong() {
        var midiObj = await this.getMidiObj();
        this.player.playMidiObj(midiObj, true);
    }

    async getMidiObj(name) {
        //var melodyUrl = "play/xxx.mid.json";
        var melodyUrl = "play/taiko0.mid.json";
        var obj = await loadJSON(melodyUrl);
        return obj;
    }


    async addItems() {
        await requirePackage("Taiko");
        console.log("TaikoBox.addItems");
        var x = this.x + 20;
        var y = this.y - 40;
        var opts = { x, y, width: 200, height: 200, id: "taikobox1" };
        this.taiko = new Taiko(opts);
        this.gtool.addGraphic(this.taiko);
        this.targets = {
            0: {x, y},
            1: {x: x+20, y}
        }
    }
}

//# sourceURL=js/TaikoBox.js
