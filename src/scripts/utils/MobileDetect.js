const isMobile = /ip(hone|od|ad)|android|blackberry.*applewebkit|bb1\d.*mobile/i.test(navigator.userAgent);

class MobileDetect {

  static isMobile() {
    return isMobile;
  }

}

export default MobileDetect;
