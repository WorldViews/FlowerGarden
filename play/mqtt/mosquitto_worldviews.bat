REM For testing, this first sends one message and then watches for messages
REM on the same channel, using the mosquitto client
REM
set HOST="worldviews.org"
"c:\Program Files\mosquitto\mosquitto_pub.exe" -h %HOST% -t donkimber/feeds/bobbletree -m 500
"c:\Program Files\mosquitto\mosquitto_sub.exe" -h %HOST% -t donkimber/feeds/bobbletree
