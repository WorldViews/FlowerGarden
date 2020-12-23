
// A garden with flowers representing Git repos for an organization
//
"use strict"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class TaikoMidi {
    constructor() {
        this.beatDur = 200;
        this.reset();
    }

    reset() {
        this.t = 200;
        this.events = [];
    }

    addKuchiShoga(str) {

        console.log("adding for kuchi shoga", str);
        str = str.replace(/\r?\n|\r/g, " ");
        str = str.replace(/  /g, " ");
        this.reset();
        this.setInstruments([116, 115]);
        var parts = str.split(/[ ,]+/);
        console.log("parts", parts);
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part == '')
                continue;
            if (part == '|')
                continue;
            //console.log("part", part);
            if (part == "don") {
                this.addNote(1);
                continue;
            }
            if (part == "doko") {
                this.addNote(0.5);
                this.addNote(0.5);
                continue;
            }
            if (part == "ka" || part == "ta") {
                this.addNote(1, "rim");
                continue;
            }
            if (part == "kara" || part == "kata") {
                this.addNote(0.5, "rim");
                this.addNote(0.5, "rim");
                continue;
            }
            if (part == "su" || part == '_' || part == '-') {
                //console.log("su add", this.beatDur);
                this.t += this.beatDur;
                continue;
            }
            alert("bad kuchi shoga part: '" + part + "'");
            return;
        }
    }

    setInstruments(instruments) {
        var event = [this.t, []];
        for (var i = 0; i < instruments.length; i++) {
            event[1].push({
                channel: i,
                instrument: instruments[i],
                type: 'programChange',
                t0: this.t
            })
        }
        this.events.push(event);
    }

    addNote(beats, target, v) {
        target = target || "center";
        if (v == null)
            v = 120;
        var ch = 0;
        var pitch = 60;
        if (target == "rim") {
            pitch = 62;
            ch = 1;
        }
        if (beats == null)
            beats = 1;
        var event = [
            this.t,
            [
                {
                    "pitch": pitch,
                    "t0": this.t,
                    "v": v,
                    "dur": 30,
                    "type": "note",
                    "channel": ch
                }
            ]
        ];
        this.events.push(event);
        this.t += beats * this.beatDur;
    }

    getMidiObj() {
        var midiObj = {
            format: 0,
            channels: [0, 1],
            instruments: [116, 115],
            resolution: 384,
            type: "MidiObj",
            loop: true,
            tracks: [
                {
                    channels: [0, 1],
                    seq: []
                }
            ]
        };
        midiObj.tracks[0].seq = this.events;
        return midiObj;
    }

    dump() {
        var midiObj = this.getMidiObj();
        var jstr = JSON.stringify(midiObj, null, 3);
        console.log("midiObj", jstr);
    }
}


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
        this.targets = {};
        player.setupTrackInfo();
        player.loadInstrument("taiko_drum");
        player.startUpdates();
        player.noteObserver = (ch, pitch, v, dur, t) => this.observeNote(ch, pitch, v, dur, t);
        var taikoMidi = new TaikoMidi();
        window.taikoMidi = taikoMidi;
        this.taikoMidi = taikoMidi;
        taikoMidi.addKuchiShoga("don don don kara kata don don su don don kara kata");
        taikoMidi.dump();
        $("#kuchiShoga").change(e => inst.noticeNewKuchiShoga());
        $("#ff1").click(e => inst.playFastAndFurious1());
        $("#ff2").click(e => inst.playFastAndFurious2());
        $("#matsuri").click(e => inst.playMatsuri());
    }

    playFastAndFurious1() {
        // https://drive.google.com/file/d/1ehq3Ndf1KEbuJZpi7xc-P-cFxjPh_b-Q/view
        var ff1 = `
        don don  don  don  ka doko doko doko
        ka  doko doko doko ka doko doko doko
        don don  don  don  ka doko doko doko
        ka  doko doko doko ka doko doko doko
        `;
        this.playKuchiShoga(ff1);
    }

    playFastAndFurious2() {
        var ff2 = `
        ka doko kara doko ka   doko kara doko
        ka doko kara doko kara doko kara doko
        ka doko kara doko ka   doko kara doko
        ka doko kara doko kara doko kara doko
        `;
        this.playKuchiShoga(ff2);
    }

    playMatsuri() {
        var matsuri = `
 su   su   su   su |

 don  su   don  su  don kara ka ka |
 don  don  su   don don kara ka ka |
 su   don  su   don don kara ka ta |
 doko su   kara don don kara ka ta |
 doko kara don  don don kara ka ta |
        `;
        this.playKuchiShoga(matsuri);
    }

    noticeNewKuchiShoga() {
        var kuchiShoga = $("#kuchiShoga").val();
        console.log("kuchiShoga", kuchiShoga);
        this.playKuchiShoga(kuchiShoga);
    }

    async playKuchiShoga(kuchiShoga) {
        kuchiShoga = kuchiShoga.trim();
        $("#kuchiShoga").val(kuchiShoga);
        this.player.pausePlaying();
        await sleep(0.5);
        this.taikoMidi.addKuchiShoga(kuchiShoga);
        var midiObj = this.taikoMidi.getMidiObj();
        await sleep(0.5);
        this.player.playMidiObj(midiObj, true);
    }

    observeNote(ch, pitch, v, t, dur) {
        console.log("observeNote", ch, pitch, v, dur, t);
        let target = this.targets[ch];
        target.on = true;
        setTimeout(() => {
            //console.log("set style", i, prevStyle);
            target.on = false;
        }, dur * 1000);
    }

    draw(canvas, ctx) {
        super.draw(canvas, ctx);
        if (this.taiko)
            this.taiko.draw(canvas, ctx);
        for (var ch in this.targets) {
            var target = this.targets[ch];
            if (!target.on)
                continue;
            ctx.fillStyle = "rgba(255,0,0,.5)";
            ctx.strokeStyle = "rgba(255,0,0,.5)";
            ctx.beginPath();
            ctx.arc(target.x, target.y, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
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
            [{ x: this.x - 100, y: ystrike }, { x: this.x + 100, y: ystrike }]);
        ctx.save();
        if (this.clipNotes) {
            ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
                if (t + dur < 0)
                    continue;
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
                var x = target.x + 2 * ki;
                var y = ystrike + t * heightPerSec;
                var h = dur * heightPerSec;
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
        this.player.loadMidiFile("/rhythm/midi/sakura.mid");
        //var midiObj = await this.getMidiObj();
        //this.taikoMidi.dump();
        var midiObj = this.taikoMidi.getMidiObj();
        this.player.playMidiObj(midiObj, true);
    }

    async playMidiFile() {
        var obj = await this.player.loadMidiFile(url);
        console.log("playMidiFile returned", obj);
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
        //this.gtool.addGraphic(this.taiko);
        x -= 8;
        y -= 55;
        this.targets = {
            0: { x, y },
            1: { x: x + 35, y }
        }
    }
}

//# sourceURL=js/TaikoBox.js
