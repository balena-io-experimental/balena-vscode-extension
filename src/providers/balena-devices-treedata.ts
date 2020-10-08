import fetch from 'node-fetch';
import * as vscode from 'vscode';

import * as scan from '../lib/scan';
import { icons, deviceIcon } from '../lib/resources';

(async () => {
    await scan.initialized;
})();

interface Collection<T> {
    [k: string]: T,
}

export default class BalenaDevicesDataProvider implements vscode.TreeDataProvider<TreeableItem> {
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
        this.devices[host].getDeviceInfo(() => {
            this._onDidChangeTreeData.fire();
        });
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

    getTreeItem(element: TreeableItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: TreeableItem): vscode.ProviderResult<TreeableItem[]> {
        if (element === undefined) {
            const devices = Object.getOwnPropertyNames(this.devices).map(k => this.devices[k]);
            return [
                new GroupItem('Local', devices, { icon: icons.balena }),
                new GroupItem('Remote', [
                    new GroupItem('Applications', [
                        new GroupItem('my-new-hotness', [], { icon: deviceIcon('raspberrypi4-64') }),
                        new GroupItem('my-old-busted', [], { icon: deviceIcon('raspberrypi3') }),
                    ]),
                ], { icon: icons.balena, description: 'balena-cloud.com' }),
            ];
        }

        if (element instanceof GroupItem) {
            return element.devices;
        }

        return null;
    }
}

type TreeableItem = GroupItem | BalenaDeviceItem;

class GroupItem extends vscode.TreeItem {
    constructor(public title: string, public devices: TreeableItem[], options?: Partial<{
        icon: string,
        description: string
    }>) {
        super(title, vscode.TreeItemCollapsibleState.Expanded);
        const opts: {
            icon?: string
            description?: string
        } = {
            ...options
        };

        this.iconPath = opts.icon;
        this.description = opts.description;
    }
}

export class BalenaDeviceItem extends vscode.TreeItem {
    constructor(public name: string, public host: string, public addresses: string[]) {
        super(name);

        this.description = addresses.filter(a => !a.includes(':')).join(', ');
        this.iconPath = deviceIcon('generic');
        this.contextValue = 'unknown-device';
        this.command = {
            command: 'balena.openDevicePanel',
            title: 'Open balena device panel',
            arguments: [name, host, addresses]
        };
    }

    public getDeviceInfo(done: Function): Promise<void> {
        return fetch(`http://${this.host}:48484/v2/local/device-info`)
            .then(res => res.json())
            .then(json => {
                this.iconPath = deviceIcon(json.info.deviceType);
                this.contextValue = 'device';
                done();
            })
            .catch(err => {
                setTimeout(() => {
                    this.getDeviceInfo(done);
                }, 2000);
            });
    }
}

class BalenaDeviceService extends vscode.TreeItem {
    static getServiceName(port: number): string {
        switch (port) {
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