
import paho.mqtt.client as mqtt

class Bobble:
    def __init__(self, topic="reachandteach/feeds/peacetree", sendVals=False):
        client = mqtt.Client()
        self.client = client
        self.topic = topic
        self.sendVals = sendVals
        print("Bobble topic:", self.topic)
        client.on_connect = self.on_connect
        client.on_disconnect = self.on_disconnect
        client.on_message = self.on_message
        client.on_publish = self.on_publish
        client.on_subscribe = self.on_subscribe
        self.connect()


    def connect(self):
        client = self.client
        host="io.adafruit.com"
        print("Connecting to", host)
        #client.connect("mqtt.eclipse.org", 1883, 60)
        client.username_pw_set("donkimber", "aio_pNca44mdiZm4C6tpMK3yGOPx3eBA")
        client.connect(host, 1883, 60)

    # The callback for when the client receives a CONNACK response from the server.
    def on_connect(self, client, userdata, flags, rc):
        print("Connected with result code "+str(rc))

        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        #client.subscribe("$SYS/#")
        topic = self.topic
        print("subscribing to", topic)
        #client.subscribe("$SYS/#")
        client.subscribe(topic)
        if self.sendVals:
            self.sendVal(client, 50)

    def on_disconnect(self, client, userdata, rc):
        print("on_disconnect", client, userdata, rc)

    def on_subscribe(self, client, userdata, mid, granted_qos):
        print("on_subscribe", userdata, mid, granted_qos)
    
    # The callback for when a PUBLISH message is received from the server.
    def on_message(self, client, userdata, msg):
        print(msg.topic+" "+str(msg.payload))

    def on_publish(self, client, userdata, mid):
        print("on_publish", client, userdata, mid)

    def sendVal(self, client, val=60):
        val = str(val)
        print("publishing to", self.topic, val)
        client.publish(self.topic, val)

    def run(self):
        # Blocking call that processes network traffic, dispatches callbacks and
        # handles reconnecting.
        # Other loop*() functions are available that give a threaded interface and a
        # manual interface.
        self.client.loop_forever()


class PeaceTree(Bobble):
    pass

def peaceTree():
    pt = PeaceTree()
    pt.run()

class Test(Bobble):
    pass

def test():
    t = Test(topic="donkimber/emotions", sendVals=True)
    t.run()

if __name__ == '__main__':
    peaceTree()
    #test()

