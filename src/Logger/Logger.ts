import * as vscode from "vscode";
import { extension } from "../GlobalConst";

const infoPrefix = "[INFO] ";
const warningPrefix = "[WARNING] ";
const errorPrefix = "[ERROR] ";
const endPrefix = "----------------------";

export class Logger {
    private logChannel: vscode.OutputChannel;
    constructor() {
        this.logChannel = vscode.window.createOutputChannel(
            extension.id,
            `markdown`
        );
        this.logInfo(extension.name + " is now active!");
    }

    logInfo(message: string) {
        this.logChannel.appendLine(infoPrefix + message);
    }
    logWarning(message: string) {
        this.logChannel.appendLine(warningPrefix + message);
    }
    logError(message: string) {
        this.logChannel.appendLine(errorPrefix + message);
    }
    logEnd() {
        this.logChannel.appendLine(endPrefix);
        this.logChannel.appendLine(``);
    }
}
