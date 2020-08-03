
// A garden with flowers representing Git repos for an organization
//
"use strict"

class TaikoBox extends MidiBox {
    async addItems() {
        await requirePackage("Taiko");
        console.log("TaikoBox.addItems");
        var opts = { x: this.x, y: this.y, id: "taikobox1" };
        this.taiko = new Taiko(opts);
        this.gtool.addGraphic(this.taiko);
    }
}

//# sourceURL=js/TaikoBox.js
