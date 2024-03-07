import * as vscode from "vscode";
import { Logger } from "./Logger/Logger";
import { TerminalManager } from "./TerminalManager/TerminalManager";
import { registerNodeCommands } from "./Commands/CommandNode";
import { registerDotnetCommands } from "./Commands/CommandDotnet";

export let logger = new Logger();
export let terminal = new TerminalManager();

export async function activate(context: vscode.ExtensionContext) {
    registerDotnetCommands(context);
    registerNodeCommands();
    logger.logInfo("Extension activated");
}

