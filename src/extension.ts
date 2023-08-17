// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("vscode-langkeeper loaded");

  let disposable = vscode.commands.registerCommand(
    "vscode-langkeeper.openConfig",
    async () => {
      const secrets = context.secrets;

      let email: any = await secrets.get("email");
      let password: any = await secrets.get("password");

	    console.log(email);

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

      vscode.window.showInformationMessage(
        "Hello World from vscode-langkeeper!" + email + password
      );

	    await secrets.store("email", email);
	    await secrets.store("password", password);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
