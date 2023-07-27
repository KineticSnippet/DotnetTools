import * as vscode from "vscode";
import { Logger } from "./Modules/Basics/Logger";
import { TerminalManager } from "./Modules/Basics/TerminalManager";
import { registerDotnetCommands as registerDotnetCommands } from "./Modules/Basics/CommandDotnet";

export let logger = new Logger();
export let terminal = new TerminalManager();

export async function activate(context: vscode.ExtensionContext) {
    registerDotnetCommands(context);
}
