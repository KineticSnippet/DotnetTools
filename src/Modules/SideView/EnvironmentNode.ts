import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../../extension";

export class NodeDependenciesProvider
    implements vscode.TreeDataProvider<Dependency>
{
    constructor(private projectPath: string) {
        logger.logInfo("Initializing SideView");
        logger.logInfo(`Project path is ${this.projectPath}`);
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        logger.logInfo(
            `Getting children of ${element ? element.label : "root"}`
        );
        logger.logInfo(`Project path is ${this.projectPath}`);
        if (!this.projectPath) {
            vscode.window.showInformationMessage(
                "No dependency in empty workspace"
            );
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(
                this.getDepsInPackageJson(
                    path.join(
                        this.projectPath,
                        "node_modules",
                        element.label,
                        "package.json"
                    )
                )
            );
        } else {
            const packageJsonPath = path.join(this.projectPath, "package.json");
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(
                    this.getDepsInPackageJson(packageJsonPath)
                );
            } else {
                vscode.window.showInformationMessage(
                    "Workspace has no package.json"
                );
                return Promise.resolve([]);
            }
        }
    }

    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
        if (this.pathExists(packageJsonPath)) {
            const toDep = (moduleName: string, version: string): Dependency => {
                if (
                    this.pathExists(
                        path.join(this.projectPath, "node_modules", moduleName)
                    )
                ) {
                    return new Dependency(
                        moduleName,
                        version,
                        vscode.TreeItemCollapsibleState.Collapsed
                    );
                } else {
                    return new Dependency(
                        moduleName,
                        version,
                        vscode.TreeItemCollapsibleState.None
                    );
                }
            };

            const packageJson = JSON.parse(
                fs.readFileSync(packageJsonPath, "utf-8")
            );

            const deps = packageJson.dependencies
                ? Object.keys(packageJson.dependencies).map((dep) =>
                      toDep(dep, packageJson.dependencies[dep])
                  )
                : [];
            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map((dep) =>
                      toDep(dep, packageJson.devDependencies[dep])
                  )
                : [];
            return deps.concat(devDeps);
        } else {
            return [];
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        Dependency | undefined | null | void
    > = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        Dependency | undefined | null | void
    > = this._onDidChangeTreeData.event;

    public refresh(): void {
        logger.logInfo("Refreshing SideView");
        this._onDidChangeTreeData.fire();
    }

    private pathExists(pathToCheck: string): boolean {
        try {
            fs.accessSync(pathToCheck);
        } catch (err) {
            return false;
        }
        return true;
    }
}

class Dependency extends vscode.TreeItem {
    constructor(
        public override readonly label: string,
        private version: string,
        public override readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }

    override iconPath = {
        light: path.join(__filename, "..", "..", "resources", "viewLogo.png"),
        dark: path.join(__filename, "..", "..", "resources", "viewLogo.png"),
    };
}
