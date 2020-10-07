import * as bonjour from 'bonjour';
import { DH_CHECK_P_NOT_SAFE_PRIME } from 'constants';
import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';

const LIFETIME = 15000;     // 15 seconds

type Expirable = {
    createdAt: number,
    updatedAt: number,
};

export type BalenaDevice = {
    name: string;
    host: string;
    addresses: string[];
} & Expirable;

interface BalenaDeviceCollection {
    [host: string]: BalenaDevice
}

interface BonjourEvents {
    deviceFound: (device: BalenaDevice) => void;
    deviceLost: (device: BalenaDevice) => void;
}

export const events: StrictEventEmitter<EventEmitter, BonjourEvents> = new EventEmitter;

const devices: BalenaDeviceCollection = {};

export function getDevices(): BalenaDevice[] {
    return Object.getOwnPropertyNames(devices).map(d => devices[d]);
}

export const initialized = (async () => {

    setInterval(() => {
        const now = new Date().getTime();
        Object.getOwnPropertyNames(devices).forEach(host => {
            if (now >= devices[host].updatedAt + LIFETIME) {
                events.emit('deviceLost', devices[host]);
                delete devices[host];
            }
        });
    }, 1000);

    const findDevices = () => {
        bonjour().find({ type: 'ssh' }, (service) => {
            if (service.port !== 22222) {
                return;
            }
            
            const now = new Date().getTime();
            const newDevice: BalenaDevice = { createdAt: now, updatedAt: now, name: service.name, host: service.host, addresses: service.addresses };
            
            if (devices[service.host]) {
                devices[service.host].updatedAt = now;
                return;
            }
            
            devices[service.host] = newDevice;
            events.emit('deviceFound', newDevice);
        });

        setTimeout(findDevices, 5000);
    };

    findDevices();
})();