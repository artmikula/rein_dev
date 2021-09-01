import FingerprintJS from '@fingerprintjs/fingerprintjs';

class DeviceService {
  getDeviceIdAsync = async () => {
    const fingerprint = await FingerprintJS.load();
    const device = await fingerprint.get({
      debug: process.env.NODE_ENV === 'development',
    });
    const deviceId = device.visitorId;
    return deviceId;
  };
}

export default new DeviceService();
