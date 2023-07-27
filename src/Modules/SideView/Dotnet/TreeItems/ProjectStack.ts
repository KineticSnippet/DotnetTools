import path from "path";
import * as vscode from "vscode";
/**
 * ProjectInto
 */
export class ProjectStack extends vscode.TreeItem {
    constructor(
        public override readonly label: string,
        public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
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
            "..",
            "Resources",
            "Icons",
            "ProjectStack.png"
        ),
        dark: path.join(
            __filename,
            "..",
            "..",
            "..",
            "..",
            "..",
            "..",
            "Resources",
            "Icons",
            "ProjectStack.png"
        ),
    };
    override contextValue = "projectStack";
}
