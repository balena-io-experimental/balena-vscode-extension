import * as vscode from 'vscode';
import { BalenaDeviceItem } from '../providers/balena-devices-treedata';

export const livePush = ({ addresses }: BalenaDeviceItem) => {
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
};

export const ssh = ({ addresses }: BalenaDeviceItem) => {
  const [address] = addresses.filter(a => !a.includes(':'));
  if (!address) {
    return;
  }

  const terminal = vscode.window.createTerminal('SSH');
  terminal.show();
  terminal.sendText(`balena ssh ${address}`);
};