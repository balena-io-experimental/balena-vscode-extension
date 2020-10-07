// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as scan from './lib/scan';

import BalenaDevicesDataProvider, { BalenaDeviceItem } from './providers/balena-devices-treedata';

(async () => {
	await scan.initialized;
})();

export function activate(context: vscode.ExtensionContext) {
	vscode.window.registerTreeDataProvider('balenaDevices', new BalenaDevicesDataProvider());

	context.subscriptions.push(
		vscode.commands.registerCommand('balena.livePush', ({ addresses }: BalenaDeviceItem) => {
			const [address] = addresses.filter(a => !a.includes(':'));
			if (!address) {
				return;
			}

			const [workspace] = vscode.workspace.workspaceFolders!;
			if (!workspace) {
				return;
			}

			const task = new vscode.Task(
				{ type: 'livepush' },
				workspace,
				'livepush',
				'livepush',
				new vscode.ShellExecution(`balena push ${address} -m`)
			);
			vscode.tasks.executeTask(task);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('balena.ssh', ({ addresses }: BalenaDeviceItem) => {
			const [address] = addresses.filter(a => !a.includes(':'));
			if (!address) {
				return;
			}

			const terminal = vscode.window.createTerminal('SSH');
			terminal.show();
			terminal.sendText(`balena ssh ${address}`);
		})
	);
}
