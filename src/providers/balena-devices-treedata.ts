import * as vscode from 'vscode';

import * as scan from '../lib/scan';
import { icons, deviceIcon } from '../lib/resources';
import { getDeviceInfo, DeviceInfo } from '../lib/device-info';
import { logs } from '../lib/commands';

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
            this.devices[host] = new BalenaDeviceItem(this, name, host, addresses);
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

        this.devices[host] = new BalenaDeviceItem(this, name, host, addresses);
        this._onDidChangeTreeData.fire();
    }

    handleDeviceLost({ name, host, addresses }: scan.BalenaDevice) {
        if (!this.devices[host]) {
            return;
        }

        delete this.devices[host];
        this._onDidChangeTreeData.fire();
    }

    public updateView() {
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
                        new GroupItem('my-new-hotness', [
                            new BalenaDeviceItem(this, "test","test.local", ["127.0.0.1"]),
                        ], { icon: deviceIcon('raspberrypi4-64') }),
                        new GroupItem('my-old-busted', [], { icon: deviceIcon('raspberrypi3') }),
                    ]),
                ], { icon: icons.balena, description: 'balena-cloud.com' }),
            ];
        }

        return element.children;
    }
}

type TreeableItem = {
    children?: TreeableItem[],
} & vscode.TreeItem;

class GroupItem extends vscode.TreeItem {
    constructor(public title: string, public children: TreeableItem[], options?: Partial<{
        icon: string,
        description: string
    }>) {
        super(title, vscode.TreeItemCollapsibleState.Collapsed);
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
    public deviceInfo: Partial<DeviceInfo>;
    public children: TreeableItem[];

    private defaultIcon = deviceIcon('unknown-color');

    constructor(private provider: BalenaDevicesDataProvider, public name: string, public host: string, public addresses: string[]) {
        super(name, vscode.TreeItemCollapsibleState.None);
            
        this.deviceInfo = {};
        this.description = addresses.filter(a => !a.includes(':')).join(', ');
        this.iconPath = this.defaultIcon;
        this.contextValue = 'unknown-device';
        
        this.children = [];

        getDeviceInfo(host, (newInfo) => {
            this.deviceInfo = {
                ...this.deviceInfo,
                ...newInfo,
            };

            // are we in local mode?
            if (this.deviceInfo.localMode !== true) {
                return this.provider.updateView();
            }
            
            this.command = {
                command: 'balena.openDevicePanel',
                title: 'Open balena device panel',
                arguments: [this],
            };
            
            this.contextValue = this.deviceInfo.localMode === true ? 'device' : 'unknown-device';

            // update our view elements...
            this.iconPath = deviceIcon(this.deviceInfo.deviceType ?? this.defaultIcon);            
            
            // add a device name, if we have one...
            this.label = this.deviceInfo.deviceName ? `${this.deviceInfo.deviceName} (${this.host})` : this.host;

            // update our service children...
            if (this.contextValue === 'device') {
                this.collapsibleState = this.collapsibleState === 0 ? vscode.TreeItemCollapsibleState.Collapsed : this.collapsibleState;
                this.children = 
                    this.deviceInfo.components!
                        .filter(c => c.type === 'service')
                        .map(app => new BalenaDeviceServiceItem(app.label, app.label, this));
            } else {
                this.collapsibleState = vscode.TreeItemCollapsibleState.None;
            }

            // refresh the tree...
            this.provider.updateView();
        });
    }
}

export class BalenaDeviceServiceItem extends vscode.TreeItem {
    private defaultIcon = icons.balenaDark;

    constructor(label: string, public serviceName: string, public device: BalenaDeviceItem) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = this.defaultIcon;
        this.contextValue = 'service';

        this.command = {
            command: 'balena.logs',
            arguments: [ this ],
            title: `Logs: ${this.serviceName}`,
        };
    }

}