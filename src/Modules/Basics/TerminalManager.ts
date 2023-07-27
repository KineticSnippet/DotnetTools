import * as vscode from "vscode";
import { logger } from "../../extension";
import { extension } from "../GlobalConst";
/**
 * TerminalManager class
 * This class is used to manage the terminal and its commands
 */
export class TerminalManager {
    private terminal: vscode.Terminal | undefined;
    constructor() {}

    // Check if the terminal exists, if not, create it
    private checkTerminal() {
        logger.logInfo(`Checking terminal...`);
        if (
            // If the terminal was killed or closed, create a new one
            this.terminal === undefined
        ) {
            logger.logInfo(`Terminal not found, creating a new one...`);
            return vscode.window.createTerminal(extension.id);
        } else {
            logger.logInfo(`Terminal found, checking if it is available...`);
            let terminals = vscode.window.terminals;
            for (let i = 0; i < terminals.length; i++) {
                if (terminals[i].name === extension.id) {
                    logger.logInfo(`Terminal found, returning it...`);
                    return terminals[i];
                }
            }
            logger.logInfo(`Terminal not found, creating a new one...`);
            return vscode.window.createTerminal(extension.id);
        }
    }
    public sendCommands(...commands: string[]) {
        this.terminal = this.checkTerminal();
        this.terminal.show();
        commands.forEach((command) => {
            this.terminal?.sendText(command);
        });
    }
    public modifyLocalReferences(
        mainProject: vscode.Uri,
        projectsToAdd: vscode.Uri[],
        projectsToRemove: vscode.Uri[]
    ) {
        if (projectsToAdd.length >= 1) {
            let addCommand = `dotnet add "${mainProject.fsPath}" reference `;
            projectsToAdd.forEach((project) => {
                addCommand += `"${project.fsPath}" `;
            });
            // Log the command to add all the references
            logger.logWarning(`Command to execute: ${addCommand}`);
            this.sendCommands(addCommand);
        }
        if (projectsToRemove.length >= 1) {
            // log the command to remove all the references
            let removeCommand = `dotnet remove "${mainProject.fsPath}" reference `;
            projectsToRemove.forEach((project) => {
                logger.logWarning(`Command to execute: ${removeCommand}`);
                removeCommand += `"${project.fsPath}" `;
                this.sendCommands(removeCommand);
            });
            // Log the command to remove all the references
        }
        logger.logWarning(`Command to execute: dotnet restore`);
        this.sendCommands(`dotnet build "${mainProject.fsPath}"`);
        logger.logInfo(`Finished modifying references`);
    }
    // check if the terminal is running
}
