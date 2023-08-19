// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch from "node-fetch";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let onStart = vscode.commands.registerCommand(
    "vscode-langkeeper.openConfig",
    async () => {
      const secrets = context.secrets;

      let address: any = await secrets.get("address");
      let email: any = await secrets.get("email");
      let password: any = await secrets.get("password");

      address = await vscode.window.showInputBox({
        placeHolder: "Enter server address",
        prompt: "Set server address",
        value: address
      });

      email = await vscode.window.showInputBox({
        placeHolder: "Enter your email",
        prompt: "Login into your account",
        value: email
      });

      password = await vscode.window.showInputBox({
        placeHolder: "Enter your password",
        prompt: "Login into your account",
        value: password
      });

      await secrets.store("address", address);
      await secrets.store("email", email);
      await secrets.store("password", password);

      vscode.window.showInformationMessage(
        "Trying to login..."
      );

      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      const response = await fetch(`${address}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const cookie = response.headers.get("set-cookie");
      const token = cookie?.split(";")[0].split("=")[1];

      if (token) {
        await secrets.store("token", token);
        vscode.window.showInformationMessage(
          "Login successful"
        );
      }
      else {
        vscode.window.showErrorMessage(
          "Login failed"
        );
      }
    }
  );

  let onSave = vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
    const token = await context.secrets.get("token");
    if (!token) {
      return;
    }

    const address = await context.secrets.get("address");
    const extension = document.fileName.split(".").pop();

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const response = await fetch(`${address}/languages/ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `id=${token}`
      },
      body: JSON.stringify({
        extension,
      }),
    });

    if (response.status !== 200) {
      vscode.window.showErrorMessage(
        "Langkeeper: Error " + await response.text()
      );
    }
  });

  context.subscriptions.push(onStart, onSave);
}

// This method is called when your extension is deactivated
export function deactivate() { }
