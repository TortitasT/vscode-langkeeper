// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch from "node-fetch";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  async function ping(document: vscode.TextDocument) {
    const token = await context.secrets.get("token");
    if (!token) {
      return;
    }

    const address = await context.secrets.get("address");
    const extension = document.fileName.split(".").pop();

    if (!address) {
      vscode.window.showErrorMessage("Langkeeper: Server address not set");
      return;
    }

    if (!extension) {
      vscode.window.showErrorMessage("Langkeeper: File extension not found");
      return;
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const response = await fetch(`${address}/languages/ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `id=${token}`,
      },
      body: JSON.stringify({
        extension,
      }),
    });

    if (response.status !== 200 && response.status !== 204) {
      vscode.window.showErrorMessage(
        "Langkeeper: Error " + (await response.text())
      );
    }
  }

  const onSetup = vscode.commands.registerCommand(
    "vscode-langkeeper.openConfig",
    async () => {
      const secrets = context.secrets;

      let address: any =
        (await secrets.get("address")) || "https://langkeeper.tortitas.eu";
      let email: any = await secrets.get("email");
      let password: any = await secrets.get("password");

      address = await vscode.window.showInputBox({
        placeHolder: "Enter server address",
        prompt: "Set server address",
        value: address,
      });

      email = await vscode.window.showInputBox({
        placeHolder: "Enter your email",
        prompt: "Login into your account",
        value: email,
      });

      password = await vscode.window.showInputBox({
        placeHolder: "Enter your password",
        prompt: "Login into your account",
        value: password,
      });

      if (!address || !email || !password) {
        vscode.window.showErrorMessage("Login failed, please fill all fields");
        return;
      }

      await secrets.store("address", address);
      await secrets.store("email", email);
      await secrets.store("password", password);

      vscode.window.showInformationMessage("Trying to login...");

      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      const response = await fetch(`${address}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const cookie = response.headers.get("set-cookie");
      const token = cookie?.split(";")[0].split("=")[1];

      if (token) {
        await secrets.store("token", token);
        vscode.window.showInformationMessage("Login successful");
      } else {
        vscode.window.showErrorMessage("Login failed");
      }
    }
  );

  const onSave = vscode.workspace.onDidSaveTextDocument(ping);

  setInterval(() => {
    const document = vscode.window.activeTextEditor?.document;
    if (document) {
      ping(document);
    }
  }, 5000);

  context.subscriptions.push(onSetup, onSave);
}

// This method is called when your extension is deactivated
export function deactivate() {}
