import * as vscode from "vscode";
import * as path from "path";
import { Version } from "../../../ProjectManager/INuget";
/**
 * NugetPackage
 */
export class NugetPackage extends vscode.TreeItem {
    constructor(
        public override readonly label: string, // id
        public readonly version: string, // local version
        public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly project: vscode.Uri,
        public override readonly description: string, // description
        public readonly versions: Version[],
        public readonly authors: string[]
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
            "Nuget.png"
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
            "Nuget.png"
        ),
    };
    override contextValue = "nugetPackage";
}
