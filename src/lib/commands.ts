import * as vscode from 'vscode';
import { BalenaDeviceItem, BalenaDeviceServiceItem } from '../providers/balena-devices-treedata';

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

export const logs = ({ serviceName, device}: BalenaDeviceServiceItem) => {
  const [address] = device.addresses.filter(a => !a.includes(':'));
  if (!address) {
    return;
  }

  const [workspace] = vscode.workspace.workspaceFolders!;
  if (!workspace) {
    return;
  }

  const task = new vscode.Task(
    { type: `${serviceName} logs` },
    workspace,
    `${serviceName} logs`,
    'balena',
    new vscode.ShellExecution(`balena logs ${address} --service ${serviceName}`)
  );
  vscode.tasks.executeTask(task);
};
