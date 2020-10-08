import * as vscode from 'vscode';
import BalenaDevicePanel from './balena-device-panel';
import { BalenaDeviceItem } from '../providers/balena-devices-treedata';

export default class BalenaPanelManager {

  public constructor(
    private context: vscode.ExtensionContext,
    private panels: BalenaDevicePanel[] = []
  ) { }

  public createOrShowDevicePanel(device: BalenaDeviceItem) {
    const existingPanel = this.panels.find(p => p.device.name === device.name);

    if (existingPanel) {
      existingPanel.panel.reveal();
      return;
    }

    // Create new panel
    let panel = new BalenaDevicePanel(this.context, device);
    this.panels.push(panel);

    // Remove panel when disposed
    panel.on('disposed', (name) => {
      this.panels = this.panels.filter(p => p.device.name !== name);
    });
  }
}