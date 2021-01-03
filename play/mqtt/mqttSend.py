
import paho.mqtt.client as mqtt
import time

TOPIC = "donkimber/feeds/bobbletree"

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    #client.subscribe("$SYS/#")
    #topic = "reachandteach/feeds/peacetree"
    topic = TOPIC
    print("subscribing to", topic);
    #client.subscribe("$SYS/#")
    client.subscribe(topic)

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))

def on_publish(client, userdata, mid):
    print(client, userdata, mid)

def sendVal(client, val=60):
    topic = TOPIC
    print("publishing to", topic, val)
    client.publish(topic, val)

def run(host="io.adafruit.com", user=None, pw=None):
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_publish = on_publish
    port = 1883
    print("Connecting to", host, port)
    #client.connect("mqtt.eclipse.org", 1883, 60)
    if user:
        print("user", user, "pw:", pw)
        client.username_pw_set("donkimber", pw)
    client.connect(host, port, 60)

    # Blocking call that processes network traffic, dispatches callbacks and
    # handles reconnecting.
    # Other loop*() functions are available that give a threaded interface and a
    # manual interface.
    #client.loop_forever()
    client.loop_start()

    vals = [0, 50, 100, 500, 1024]
    for val in vals:
        sendVal(client, val)
        time.sleep(4)

"""
Note, to test this with a local mosquitto clients you could use
"c:\Program Files\mosquitto\mosquitto_sub.exe" -h worldviews.org -t donkimber/feeds/bobbletree
to watch
and

"""
if __name__ == '__main__':
    #run("io.adafruit.com", "donkimber", "aio_HMWG45yUsVI72dEx0W2lFWoiv7QF")
    #run("io.adafruit.com", "donkimber", "aio_eVJW42TnBdjKwLLEmYNtiYQeEmDu")
    run("worldviews.org")
    #run("localhost")
