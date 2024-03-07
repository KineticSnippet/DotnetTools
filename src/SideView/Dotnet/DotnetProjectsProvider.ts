import * as vscode from "vscode";
import * as path from "path";
import { DotnetManager } from "../../ProjectManager/ProjectManager";
import { ProjectStack } from "./TreeItems/ProjectStack";
import { NugetStack } from "./TreeItems/NugetStack";
import { NugetPackage } from "./TreeItems/NugetPackage";
import { DotnetProject } from "./TreeItems/DotnetProject";
import { logger } from "../../extension";
import { dotnetProjectCommands } from "../../GlobalConst";

export class DotnetProjectsProvider
    implements
        vscode.TreeDataProvider<
            DotnetProject | (NugetPackage | ProjectStack) | NugetStack
        >
{
    workspaceDotnetProjects: Promise<vscode.Uri[]>;
    constructor() {
        this.workspaceDotnetProjects = DotnetManager.findDotnetProjects();
    }

    getTreeItem(element: DotnetProject): vscode.TreeItem {
        return element;
    }
    getChildren(
        element?:
            | DotnetProject
            | undefined
            | (NugetPackage | ProjectStack)
            | NugetStack
    ): vscode.ProviderResult<
        DotnetProject[] | (NugetPackage | ProjectStack)[] | NugetStack[]
    > {
        if (!this.workspaceDotnetProjects) {
            vscode.window.showInformationMessage(
                "No projects in the current workspace"
            );
            return Promise.resolve([]);
        }
        if (element instanceof DotnetProject) {
            // return a new nuget package provider
            logger.logInfo("Getting nuget packages for project");
            return new Promise((resolve) => {
                this.cascadeProject(element.project!).then((providers) => {
                    resolve(providers);
                });
            });
        }
        if (element instanceof NugetStack) {
            return this.getNugetPackages(element.project);
        }
        if (element instanceof ProjectStack) {
            const references = DotnetManager.getReferencedProjects(
                element.project
            );
            return Promise.resolve(
                references.then((references) => {
                    return references.map((reference) => {
                        return new DotnetProject(
                            path.basename(reference.fsPath, ".csproj"),
                            vscode.TreeItemCollapsibleState.None,
                            {
                                command: dotnetProjectCommands.openProject,
                                title: "Open project",
                                arguments: [reference],
                            },
                            reference
                        );
                    });
                    // order the references by name
                })
            ).then((references) => {
                return references.sort((a, b) => {
                    if (a.label > b.label) {
                        return 1;
                    } else if (a.label < b.label) {
                        return -1;
                    }
                    return 0;
                });
            });
        } else {
            logger.logInfo("Getting all projects in workspace");
            return this.getProjects();
        }
    }
    public getNugetPackages(project: vscode.Uri): Promise<NugetPackage[]> {
        return DotnetManager.getNugetPackages(project);
    }

    public async cascadeProject(
        uri: vscode.Uri
    ): Promise<(NugetStack | ProjectStack)[]> {
        // create a new nuget package provider
        const provider = new NugetStack(
            "Nuget Packages",
            "",
            vscode.TreeItemCollapsibleState.Expanded,
            uri
        );
        // create a new file explorer with all the files in the project
        const fileExplorer = new ProjectStack(
            "Project References",
            vscode.TreeItemCollapsibleState.Collapsed,
            uri
        );

        return [provider, fileExplorer];
    }

    /**
     * Returns a Promise that resolves to an array of DotnetProject objects representing the .NET projects in the current workspace.
     * If there are no projects in the workspace, the Promise resolves to an empty array.
     * @returns A Promise that resolves to an array of DotnetProject objects representing the .NET projects in the current workspace.
     */
    async getProjects(): Promise<DotnetProject[]> {
        // Check how many projects are in the workspace
        this.workspaceDotnetProjects = DotnetManager.findDotnetProjects();
        return this.workspaceDotnetProjects.then(async (projects) => {
            if (projects.length === 0) {
                return Promise.resolve([]);
            } else {
                return Promise.resolve(
                    projects.map((project) => {
                        return new DotnetProject(
                            // Get the name of the project without the path and extension
                            path.basename(project.fsPath, ".csproj"),
                            vscode.TreeItemCollapsibleState.Collapsed,
                            {
                                command: dotnetProjectCommands.openProject,
                                title: "Open project",
                                arguments: [project],
                            },
                            project
                        );
                    })
                ).then((projects) => {
                    return projects.sort((a, b) => {
                        if (a.label > b.label) {
                            return 1;
                        } else if (a.label < b.label) {
                            return -1;
                        }
                        return 0;
                    });
                });
            }
        });
    }

    // event emitter
    private _onDidChangeTreeData: vscode.EventEmitter<
        | DotnetProject
        | (NugetPackage | ProjectStack)
        | NugetStack
        | undefined
        | void
    > = new vscode.EventEmitter<
        | DotnetProject
        | (NugetPackage | ProjectStack)
        | NugetStack
        | undefined
        | void
    >();

    readonly onDidChangeTreeData: vscode.Event<
        | DotnetProject
        | (NugetPackage | ProjectStack)
        | NugetStack
        | undefined
        | void
    > = this._onDidChangeTreeData.event;

    refreshDotnetTree(): void {
        this._onDidChangeTreeData.fire();
    }
}
