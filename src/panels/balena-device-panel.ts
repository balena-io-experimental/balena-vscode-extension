import { EventEmitter } from 'events';
import * as vscode from 'vscode';

import { deviceIcon, icons, scripts } from '../lib/resources';
import { livePush, reset, ssh } from '../lib/commands';
import { BalenaDeviceItem } from '../providers/balena-devices-treedata';

export default class BalenaDevicePanel extends EventEmitter {
  public readonly viewType = 'balenaDevice';
  public panel: vscode.WebviewPanel;

  constructor(public context: vscode.ExtensionContext, public device: BalenaDeviceItem) {
    super();
    this.panel = vscode.window.createWebviewPanel(
      this.viewType,          // Internal panel type
      device.host,            // Webview title
      vscode.ViewColumn.One,  // Open in location
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    this.panel.webview.html = this.getHtmlForWebview();
    this.panel.iconPath = vscode.Uri.file(deviceIcon(device.deviceInfo.deviceType ?? 'unknown'));
    this.panel.onDidDispose(() => this.emit('disposed', this.device.name));
    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'ssh':
            ssh(this.device);
            return;
          case 'livepush':
            livePush(this.device);
            return;
          case 'reset':
            const name = await vscode.window.showInputBox({ prompt: 'New device name', value: this.device.deviceInfo.deviceName })
            if (name === undefined) {
              return;
            }
            
            reset(this.device, name);
            return;
        }
      }
    );
  }

  private getHtmlForWebview(): string {
    const scriptUri = this.panel.webview.asWebviewUri(vscode.Uri.file(scripts('main.js')));

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body>
                <h3>Device information</h3>
                <ul>
                  <li>Name: ${this.device.name}</li>
                  <li>Hostname: ${this.device.host}</li>
                  <li>IPv4: ${this.device.addresses.filter(a => a.includes('.'))}</li>
                  <li>IPv6: ${this.device.addresses.filter(a => a.includes(':'))}</li>
                </ul>
                <h3>Actions</h3>
                <button type="button" onclick="livepush()">LivePush</button>
                <button type="button" onclick="ssh()">SSH</button>
                <button type="button" onclick="reset()">Reset</button>
                <div id='container'></div>
                <script src="${scriptUri}"></script>
              </body>
            </html>`;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}