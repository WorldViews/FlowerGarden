
class PanoProxy {
    constructor(display) {
        this.playTime = 0;
        this.playSpeed = 1;
        this.playing = false;
        this.yaw = 0;
        this.pitch = 0;
        this.fov = 60;
        this.display = display;
        this.player = display.player;
    }

    setVideoURL(url) {
        console.log("setVideoURL", url);
    }
    setImageSource(src) {
        this.imageSrc = src;
    }

    setPlayTime(t) {
        this.playTime = t;
        this.display.setPlayTime(t);
    }

    getPlayTime() {
        return this.playTime;
    }

    getViewYaw() {
        return this.yaw;
    }

    getViewPitch() {
        return this.pitch;
    }

    getViewFOV() {
        return this.fov;
    }

    setViewYawPhi(yaw, phi) {
        this.yaw = yaw;
        this.phi = phi;
    }

    setPlaySpeed(speed) {
        this.speed = speed;
    }

    play() {
        this.playing = true;
    }

    pause() {
        this.playing = false;
    }
}

