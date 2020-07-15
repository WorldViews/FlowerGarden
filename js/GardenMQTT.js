

class GardenMQTT {
    constructor() {
        var inst = this;
        // Create a client instance
        var host = "io.adafruit.com";
        var port = 443;
        //var port = 8883;
        var client = new Paho.MQTT.Client(host, port, "test1234");
        console.log("client", client);
        this.client = client;
        this.observer = null;
        // set callback handlers
        client.onConnectionLost = (responseObject) => {
            inst.onConnectionLost(responseObject);
        }
        client.onMessageArrived = (msg) => {
            inst.onMessageArrived(msg);
        }
        //this.connect();
    }

    connect() {
        var inst = this;
        // connect the client
        var opts = {
            onSuccess: () => inst.onConnect(),
            userName: "donkimber",
            password: "aio_pNca44mdiZm4C6tpMK3yGOPx3eBA"
        };
        console.log("initiating connect", opts);
        this.client.connect(opts);
    }

    // called when the client connects
    onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log("onConnect");
        this.client.subscribe("reachandteach/feeds/peacetree");
        this.connected = true;
        //client.send(message);
    }

    sendMessage(str) {
        var message = new Paho.MQTT.Message("Hello");
        message.destinationName = "World";
        this.client.send(message);
    }

    // called when the client loses its connection
    onConnectionLost(responseObject) {
        this.connected = false;
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
        var inst = this;
        setTimeout(() => inst.connect(), 2000);
    }

    // called when a message arrives
    onMessageArrived(message) {
        console.log("onMessageArrived:" + message.payloadString);
        $("#jsonArea").html(message.payloadString);
        if (this.observer) {
            try {
                this.observer(message.payloadString);
            }
            catch (e) {
                console.log("error on observer", e);
            }
        }
    }
}

