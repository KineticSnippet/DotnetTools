import * as vscode from "vscode";
import * as path from "path";
/**
 * NugetPackageProvider
 */
export class NugetStack extends vscode.TreeItem {
    constructor(
        public override readonly label: string,
        public readonly version: string,
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
            "NugetStack.png"
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
            "NugetStack.png"
        ),
    };
    override contextValue = "nugetStack";
}
