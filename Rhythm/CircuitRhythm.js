
var DATAFEED_WEBHOOK = "https://io.adafruit.com/api/v2/webhooks/feed/M383TjgC5uNb2Aui56DCSTXPxUAd";

if ("serial" in navigator) {
  console.log("serial available");
}
else {
  alert("Cannot access serial");
}

function sendValue(val) {
  console.log("sendValue", val);
  //$("#status").html(val);
  var url = DATAFEED_WEBHOOK;
  var obj = {'value': val};
  console.log("post", obj, url);
  $.post(url, obj, val => {
      console.log("receieved", val)
  });
}

class RhythmStick {
  constructor() {
    this.port = null;
  }

  async read(port) {
    console.log("starting reader for port");
    const reader = port.readable.getReader();
    const decoder = new TextDecoder("utf-8");
    // Listen to data coming from the serial device.
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Allow the serial port to be closed later.
        reader.releaseLock();
        break;
      }
      // bytes is a Uint8Array.
      //console.log("bytes:", value);
      //var uint8array = new TextEncoder("utf-8").encode("¢");
      var str = decoder.decode(value);
      console.log("received:", str)
      $("#log").append(str);
      let parts = str.split(" ");
      if (parts.length < 1)
        continue;
      let com = parts[0].trim();
      if (com == "strike")
        this.handleStrike(parts);
      if (com == "clear")
        this.handleClear(parts);
      if (com == "color")
        this.handleColor(parts);
      console.log(parts)

    }
  }

  handleStrike(parts) {
    console.log("handleStrike", parts)
    //$("#tab").css('background', 'red');
  }

  handleClear(parts) {
    //$("#tab").css('background', 'white');
  }

  handleColor(parts) {
    var r = Number(parts[1]) * 2;
    var g = Number(parts[2]) * 2;
    var b = Number(parts[3]) * 2;
    var color = "rgb("+r+","+g+","+b+")";
    $("#tab").css('background', color);
  }

  async setup() {
    // Prompt user to select any serial port.
    console.log("setup");
    let port = await navigator.serial.requestPort();
    this.port = port;
    const info = port.getInfo();
    const { usbProductId, usbVendorId } = info;
    console.log("info", info);
    console.log("usbProductId", usbProductId);
    // Wait for the serial port to open.
    console.log("opening");
    await port.open({ baudRate: 9600 });
    console.log("opened")
    this.read(port);
  }
}

let stick = null;

$(document).ready(() => {
  stick = new RhythmStick();
  $("#start").click(() => stick.setup());
});

