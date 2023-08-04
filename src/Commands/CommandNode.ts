import * as vscode from "vscode";
import { NodeProjectProvider } from "../SideView/Node/NodeProjectProvider";
import { treeViewNames } from "../GlobalConst";
import path from "path";
/**
 * Registers all node commands and tree view providers.
 */

const watcher = vscode.workspace.createFileSystemWatcher("**/package.json");

export async function registerNodeCommands() {
    // find all the package.json files
    const projects = await vscode.workspace.findFiles(
        "**/package.json",
        "**/node_modules/**"
    );
    if (!projects) {
        return;
    }
    let folder = path.dirname(projects[0].fsPath);
    const nodeProjectTreeView = new NodeProjectProvider(folder);

    vscode.window.registerTreeDataProvider(
        treeViewNames.nugetPackages,
        nodeProjectTreeView
    );

    watcher.onDidChange(async () => {
        nodeProjectTreeView.refresh();
    });
}
