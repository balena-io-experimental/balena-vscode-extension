import fetch from 'node-fetch';
import * as vscode from 'vscode';

export interface DeviceInfo {
    deviceType: string,
    localMode: boolean,
}

export async function getDeviceInfo(host: string, callback: (info: Partial<DeviceInfo>) => void): Promise<void> {
    const latestInfo: Partial<DeviceInfo> = {};
    
    try {
        const res = await fetch(`http://${host}:48484/v2/local/device-info`);
        const deviceInfo = await res.json();

        latestInfo.deviceType = deviceInfo.info.deviceType;
        latestInfo.localMode = false;
    } catch {
        latestInfo.localMode = false;
    } finally {
        callback(latestInfo);
        setTimeout(() => {
            getDeviceInfo(host, callback);
        }, 3000);
    }
}
