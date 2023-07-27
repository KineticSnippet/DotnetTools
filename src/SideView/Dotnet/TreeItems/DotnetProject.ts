import path from "path";
import * as vscode from "vscode";
/**
 * DotnetProject
 */
export class DotnetProject extends vscode.TreeItem {
    constructor(
        public override readonly label: string,
        public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public override readonly command: vscode.Command,
        public readonly project: vscode.Uri
    ) {
        super(label, collapsibleState);
    }
    override iconPath = {
        light: path.join(
            __filename,
            "..",
            "..",
            "..",
            "..",
            "..",
            "Resources",
            "Icons",
            "Project.png"
        ),
        dark: path.join(
            __filename,
            "..",
            "..",
            "..",
            "..",
            "..",
            "Resources",
            "Icons",
            "Project.png"
        ),
    };
    override contextValue = "dotnetProject";
}
