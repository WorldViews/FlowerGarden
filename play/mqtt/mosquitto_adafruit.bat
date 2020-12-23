REM For testing, this first sends one message and then watches for messages
REM on the same channel, using the mosquitto client
REM
set HOST="io.adafruit.com"
set PW=aio_eVJW42TnBdjKwLLEmYNtiYQeEmDu
"c:\Program Files\mosquitto\mosquitto_pub.exe" -h %HOST% -u donkimber -P %PW% -t donkimber/feeds/bobbletree -m 600
"c:\Program Files\mosquitto\mosquitto_sub.exe" -h %HOST% -u donkimber -P %PW% -t donkimber/feeds/bobbletree
