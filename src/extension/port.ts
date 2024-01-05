import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.showWebview',
    () => {
      // Get the active text editor

      // Get the document's languageId (e.g., 'typescript')

      // Create a panel
      const panel = vscode.window.createWebviewPanel(
        'extensionWebview',
        'My Extension Webview',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      )
      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        (message) => {
          debugger
          vscode.window.showInformationMessage(
            `Received message from WebView: ${message}`
          )
        },
        undefined,
        context.subscriptions
      )

      // Set the content for the webview
      panel.webview.html = getWebviewContent()
    }
  )

  context.subscriptions.push(disposable)
}

function getWebviewContent(): string {
  // TypeScript code snippet for the WebView
  const codeSnippet = `
        // Your TypeScript code here
        console.log('Hello from WebView!');
    `

  // HTML content for the webview
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My Extension WebView</title>
						<script defer>
							debugger;
							// Handle messages from the extension
                const vscode = acquireVsCodeApi();
                window.addEventListener('message', event => {
									debugger;
                    const message = event.data;
                    // Process the received message as needed
                    console.log('Received message in WebView:', message);
                });
								vscode.postMessage('Hello from WebView!');
						</script>
        </head>
        <body>
            <pre><code>${codeSnippet}</code></pre>
        </body>
        </html>
    `
}

export function deactivate() {}
