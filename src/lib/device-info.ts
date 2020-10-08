import fetch from 'node-fetch';

export type DeviceInfoComponent = {
    type: 'service' | 'application',
    label: string,
};

export interface DeviceInfo {
    deviceName: string;
    components: DeviceInfoComponent[]
    deviceType: string,
    localMode: boolean,
}

export async function getDeviceInfo(host: string, callback: (info: Partial<DeviceInfo>) => void): Promise<void> {
    const latestInfo: Partial<DeviceInfo> = {};
    
    try {
        const res = await fetch(`http://${host}:48484/v2/local/device-info`);
        const deviceInfo = await res.json();

        latestInfo.deviceType = deviceInfo.info.deviceType;
        latestInfo.localMode = true;
    } catch {
        latestInfo.localMode = false;
    } 
    
    try {
        const res = await fetch(`http://${host}:48484/v2/local/target-state`);
        const targetState = await res.json();

        latestInfo.deviceName = targetState.state.local.name;

        const services: DeviceInfoComponent[] = [];
        const apps: DeviceInfoComponent[] = Object.getOwnPropertyNames(targetState.state.local.apps).map(appId => {
            
            const appServices: DeviceInfoComponent[] = Object.getOwnPropertyNames(targetState.state.local.apps[appId].services).map(serviceId => {
                const label = targetState.state.local.apps[appId].services[serviceId].labels?.['io.balena.service-name'];
                return {
                    type: 'service',
                    label: label ?? '',
                } as DeviceInfoComponent;
            }).filter(c => c.label !== '');

            appServices.map(appService => {
                services.push(appService);
            });

            return {
                type: 'application',
                label: targetState.state.local.apps[appId].name,
            };
        });

        latestInfo.components = [
            ...apps,
            ...services,
        ];

        console.log('latestInfo', latestInfo);

    } catch {
        
    } finally {   
        callback(latestInfo);
        setTimeout(() => {
            getDeviceInfo(host, callback);
        }, 3000);
    }
}
