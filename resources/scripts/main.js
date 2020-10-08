const vscode = acquireVsCodeApi();

function ssh () {
  vscode.postMessage({
    command: 'ssh'
  });
}

function livepush () {
  vscode.postMessage({
    command: 'livepush'
  });
}

function reset () {
  vscode.postMessage({
    command: 'reset'
  });
}