import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import * as path from 'path';
import { livePush, ssh } from '../lib/commands';
import { BalenaDeviceItem } from '../providers/balena-devices-treedata';

export default class BalenaDevicePanel extends EventEmitter {
  public readonly viewType = 'balenaDevice';
  public panel: vscode.WebviewPanel;

  constructor(public context: vscode.ExtensionContext, public name: string, public host: string, public addresses: string[]) {
    super();
    this.panel = vscode.window.createWebviewPanel(
      this.viewType,          // Internal panel type
      host,                   // Webview title
      vscode.ViewColumn.One,  // Open in location
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    this.panel.webview.html = this.getHtmlForWebview();
    this.panel.iconPath = vscode.Uri.file(
      path.join(
        context.extensionPath,
        'resources',
        'balena.png'
      )
    );
    this.panel.onDidDispose(() => this.emit('disposed', this.name));
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'ssh':
            ssh({ addresses: this.addresses } as BalenaDeviceItem);
            return;
          case 'livepush':
            livePush({ addresses: this.addresses } as BalenaDeviceItem);
            return;
        }
      }
    );
  }

  private getHtmlForWebview(): string {
    const scriptPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js');
    const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);
    console.log(scriptUri);

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
                  <li>Name: ${this.name}</li>
                  <li>Hostname: ${this.host}</li>
                  <li>IPv4: ${this.addresses.filter(a => a.includes('.'))}</li>
                  <li>IPv6: ${this.addresses.filter(a => a.includes(':'))}</li>
                </ul>
                <h3>Actions</h3>
                <button type="button" onclick="livepush()">LivePush</button>
                <button type="button" onclick="ssh()">SSH</button>
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