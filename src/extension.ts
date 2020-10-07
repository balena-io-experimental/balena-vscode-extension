// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as scan from './lib/scan';

import BalenaDevicesDataProvider, { BalenaDeviceItem } from './providers/balena-devices-treedata';
import BalenaPanelManager from './panels/balena-panel-manager';
import { livePush, ssh } from './lib/commands';

(async () => {
	await scan.initialized;
})();

export function activate(context: vscode.ExtensionContext) {
	let panelManager: BalenaPanelManager = new BalenaPanelManager(context);
	vscode.window.registerTreeDataProvider('balenaDevices', new BalenaDevicesDataProvider());

	context.subscriptions.push(
		vscode.commands.registerCommand('balena.livePush', livePush)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('balena.ssh', ssh)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('balena.openDevicePanel', (name, host, addresses) => panelManager.createOrShowDevicePanel(name, host, addresses))
	);
}
