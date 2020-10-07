import * as vscode from 'vscode';
import * as scan from '../lib/scan';
import { icons } from '../lib/resources';

(async () => {
    await scan.initialized;
})();

interface Collection<T> {
    [k: string]: T,
}

export default class BalenaDevicesDataProvider implements vscode.TreeDataProvider<BalenaDeviceItem> {
    private devices: Collection<BalenaDeviceItem> = {};
    
    _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    
    constructor() {

        scan.getDevices().forEach(({ name, host, addresses }) => {
            this.devices[host] = new BalenaDeviceItem(name, host, addresses);
        });
        
        scan.events.on('deviceFound', (device) => {
            this.handleDeviceFound(device);
        });
        scan.events.on('deviceLost', (device) => {
            this.handleDeviceLost(device);
        });
    }

    handleDeviceFound({ name, host, addresses }: scan.BalenaDevice) {
        if (this.devices[host]) {
            return;
        }

        this.devices[host] = new BalenaDeviceItem(name, host, addresses);
        this._onDidChangeTreeData.fire();
    }

    handleDeviceLost({ name, host, addresses }: scan.BalenaDevice) {
        if (!this.devices[host]) {
            return;
        }

        delete this.devices[host];
        this._onDidChangeTreeData.fire();
    }

    onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;
    
    getTreeItem(element: BalenaDeviceItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: BalenaDeviceItem): vscode.ProviderResult<BalenaDeviceItem[]> {
        if (element === undefined) {
            const devices = Object.getOwnPropertyNames(this.devices).map(k => this.devices[k]);
            return devices;
        }

        return null;
    }
}

export class BalenaDeviceItem extends vscode.TreeItem {
    constructor(public name: string, public host: string, public addresses: string[]) {
        super(name);
        
        this.description = addresses.join(', ');
        this.iconPath = icons.balena;
        this.contextValue = 'device';
    }
}

class BalenaDeviceService extends vscode.TreeItem {
    static getServiceName(port: number):string {
        switch(port) {
            case 22:
            case 22222:
                return 'SSH';
            default:
                return 'Unknown';
        }
    }
    constructor(public device: BalenaDeviceItem, public port: number) {
        super(BalenaDeviceService.getServiceName(port));
        this.description = `:${port}`;
    }
}