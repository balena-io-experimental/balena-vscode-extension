import fetch from 'node-fetch';
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

export const ssh = (context: BalenaDeviceItem | BalenaDeviceServiceItem) => {

  let serviceName = "";
  if (context instanceof BalenaDeviceServiceItem) {
    serviceName = context.serviceName;
    context = context.device;
  }

  const [address] = context.addresses.filter(a => !a.includes(':'));
  if (!address) {
    return;
  }

  const terminal = vscode.window.createTerminal('SSH');
  terminal.show();
  terminal.sendText(`balena ssh ${address} ${serviceName}`);
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

export const reset = async ({ addresses, deviceInfo }: BalenaDeviceItem) => {
  const [address] = addresses.filter(a => !a.includes(':'));
  if (!address) {
    return;
  }

  const [workspace] = vscode.workspace.workspaceFolders!;
  if (!workspace) {
    return;
  }

  try {
    const res = await fetch(`http://${address}:48484/v2/local/target-state`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        local: {
          name: deviceInfo.deviceName ?? 'my-device',
          apps: {},
          config: {},
        },
        dependent: {
          apps: [],
          devices: [],
        }
      })
    });

    const { status, message } = await res.json();

    vscode.window.showInformationMessage(`Reset device: ${status}: ${message}`);
  } catch(err) {
    vscode.window.showErrorMessage(`Reset device failed`, err);    
  }
};
