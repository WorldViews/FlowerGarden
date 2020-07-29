"use strict"

class Display {
    constructor(gtool, parentName, opts) {
        opts = opts || {};
        //super(opts);
        this.name = opts.name;
        this.gtool = gtool;
        var str = "";
        str += '<div id="mainScreen">\n';
        //str += '<iframe id="imageView"></iframe>\n';
        str += '<img id="imageView" src="">\n';
        str += '</div>';
        var div = $(str);
        div.appendTo($('#'+parentName));
    }
}

