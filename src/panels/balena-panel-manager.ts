import * as vscode from 'vscode';
import BalenaDevicePanel from './balena-device-panel';

export default class BalenaPanelManager {

  public constructor(
    private context: vscode.ExtensionContext,
    private panels: BalenaDevicePanel[] = []
  ) { }

  public createOrShowDevicePanel(name: string, host: string, addresses: string[]) {
    let existingPanel: BalenaDevicePanel | undefined = this.panels.find(p => p.name === name);

    if (existingPanel) {
      existingPanel.panel.reveal();
    } else {
      // Create new panel
      let panel = new BalenaDevicePanel(this.context, name, host, addresses);
      this.panels.push(panel);

      // Remove panel when disposed
      panel.on('disposed', (name) => {
        this.panels = this.panels.filter(p => p.name !== name);
      });
    }

  }
}