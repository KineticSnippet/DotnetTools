import * as vscode from "vscode";
import { DotnetManager } from "../ProjectManager/ProjectManager";
import { DotnetProjectsProvider } from "../SideView/Dotnet/DotnetProjectsProvider";
import { NugetStack } from "../SideView/Dotnet/TreeItems/NugetStack";
import { NugetPackage } from "../SideView/Dotnet/TreeItems/NugetPackage";
import { DotnetProject } from "../SideView/Dotnet/TreeItems/DotnetProject";
import { ProjectStack } from "../SideView/Dotnet/TreeItems/ProjectStack";
import {
    dotnetCommands,
    dotnetTreeViewCommands,
    treeViewNames,
} from "../GlobalConst";
import { logger } from "../extension";

// listener for dotnet project changes
const watcher = vscode.workspace.createFileSystemWatcher("**/*.csproj");

export function registerDotnetCommands(context: vscode.ExtensionContext) {
    // Add or remove references from a csproj file
    const manageReferences = vscode.commands.registerCommand(
        dotnetCommands.manageReferences,
        async (clicker: vscode.Uri | DotnetProject | ProjectStack) => {
            logger.logInfo(`Command ${dotnetCommands.manageReferences} called`);
            if (clicker === undefined) {
                const project = DotnetManager.findDotnetProjects();
                clicker = await DotnetManager.selectProject(project);
            } else if (clicker instanceof DotnetProject) {
                clicker = clicker.project;
            } else if (clicker instanceof ProjectStack) {
                clicker = clicker.project;
            }
            await DotnetManager.manageReferences(clicker);
        }
    );

    // Run the command `dotnet build` in a selected project
    const buildProject = vscode.commands.registerCommand(
        dotnetCommands.buildProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(`Command ${dotnetCommands.buildProject} called`);
                const project = DotnetManager.findDotnetProjects();
                if (clicker === undefined) {
                    clicker = await DotnetManager.selectProject(project);
                }
                if (clicker instanceof DotnetProject) {
                    clicker = clicker.project;
                }
                DotnetManager.buildProject(clicker);
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Run the selected project
    const runProject = vscode.commands.registerCommand(
        dotnetCommands.runProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(`Command ${dotnetCommands.runProject} called`);
                const project = DotnetManager.findDotnetProjects();
                if (clicker === undefined) {
                    clicker = await DotnetManager.selectProject(project);
                }
                if (clicker instanceof DotnetProject) {
                    clicker = clicker.project;
                }
                DotnetManager.runProject(clicker);
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Run the command `dotnet watch run` in a selected project
    const watchAndRunProject = vscode.commands.registerCommand(
        dotnetCommands.watchAndRunProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetCommands.watchAndRunProject} called`
                );
                const project = DotnetManager.findDotnetProjects();
                if (clicker === undefined) {
                    clicker = await DotnetManager.selectProject(project);
                }
                if (clicker instanceof DotnetProject) {
                    clicker = clicker.project;
                }
                DotnetManager.watchAndRunProject(clicker);
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Restore a project
    const restoreProject = vscode.commands.registerCommand(
        dotnetCommands.restoreProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetCommands.restoreProject} called`
                );
                const project = DotnetManager.findDotnetProjects();
                if (clicker === undefined) {
                    clicker = await DotnetManager.selectProject(project);
                }
                if (clicker instanceof DotnetProject) {
                    clicker = clicker.project;
                }
                if (clicker.fsPath.endsWith(".csproj" || ".fsproj")) {
                    DotnetManager.restoreProject(clicker);
                }
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Open a project as text
    const openProject = vscode.commands.registerCommand(
        dotnetCommands.openProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(`Command ${dotnetCommands.openProject} called`);
                if (clicker === undefined) {
                    const project = DotnetManager.findDotnetProjects();
                    clicker = await DotnetManager.selectProject(project);
                } else if (clicker instanceof DotnetProject) {
                    clicker = clicker.project;
                }
                DotnetManager.openProject(clicker);
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Add nuget package(s) to a selected project
    const addNugetPackages = vscode.commands.registerCommand(
        dotnetCommands.addNugetPackage,
        async (clicker: NugetStack | DotnetProject | vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetCommands.addNugetPackage} called`
                );
                let projectToAddPackage: vscode.Uri | undefined;
                if (clicker === undefined) {
                    projectToAddPackage = await DotnetManager.selectProject(
                        DotnetManager.findDotnetProjects()
                    );
                } else {
                    if (clicker instanceof DotnetProject) {
                        projectToAddPackage = clicker.project;
                    } else if (clicker instanceof vscode.Uri) {
                        projectToAddPackage = clicker;
                    } else {
                        projectToAddPackage = clicker.project;
                    }
                }
                logger.logInfo(
                    `Managing nuget packages of ${projectToAddPackage.fsPath}`
                );
                DotnetManager.addNugetPackage(projectToAddPackage);
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Remove one or more nuget(s) packages from a project
    const removeNugetPackages = vscode.commands.registerCommand(
        dotnetCommands.removeNugetPackage,
        async (clicker: NugetPackage | NugetStack | vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetCommands.removeNugetPackage} called`
                );
                let projectToRemove: vscode.Uri;
                if (clicker instanceof NugetPackage) {
                    // if we receive a NugetPackage, we know which project to remove the package from
                    DotnetManager.removeNugetPackage(clicker.project, [
                        clicker.label,
                    ]);
                } else if (clicker instanceof NugetStack) {
                    projectToRemove = clicker.project;
                    DotnetManager.removeNugetPackage(projectToRemove);
                } else if (clicker instanceof vscode.Uri) {
                    projectToRemove = clicker;
                    DotnetManager.removeNugetPackage(projectToRemove);
                } else {
                    const projectToRemovePackage =
                        await DotnetManager.selectProject(
                            DotnetManager.findDotnetProjects()
                        );
                    DotnetManager.removeNugetPackage(projectToRemovePackage);
                }
            } catch (error) {
                if (error instanceof Error) {
                    logger.logError(error.message);
                }
            }
        }
    );

    // Add a project to a sln file
    const addProjectToSolution = vscode.commands.registerCommand(
        dotnetCommands.addProjectToSln,
        async (clicker: vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetCommands.addProjectToSln} called`
                );
                if (clicker === undefined) {
                    const solutions = DotnetManager.findDotnetSolutions();
                    clicker = await DotnetManager.selectSolution(solutions);
                }
                DotnetManager.addProjectToSolution(clicker);
            } catch (error) {}
        }
    ); // Add a project to a sln file
    const addAllProjectsToSolution = vscode.commands.registerCommand(
        dotnetCommands.addAllProjectsToSln,
        async (clicker: vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetCommands.addProjectToSln} called`
                );
                if (clicker === undefined) {
                    const solutions = DotnetManager.findDotnetSolutions();
                    clicker = await DotnetManager.selectSolution(solutions);
                }
                DotnetManager.addProjectToSolution(clicker, true);
            } catch (error) {}
        }
    );

    const dotnetProjectsTreeView = new DotnetProjectsProvider();
    vscode.window.registerTreeDataProvider(
        treeViewNames.dotnetProjects,
        dotnetProjectsTreeView
    );

    let refreshNugetTreeView = vscode.commands.registerCommand(
        dotnetTreeViewCommands.refreshTreeView,
        async () => {
            logger.logInfo(
                `Command ${dotnetTreeViewCommands.refreshTreeView}.refreshTreeView called`
            );
            dotnetProjectsTreeView.refreshDotnetTree();
        }
    );

    watcher.onDidChange(async () => {
        dotnetProjectsTreeView.refreshDotnetTree();
    });

    context.subscriptions.push(refreshNugetTreeView);
    context.subscriptions.push(
        manageReferences,
        buildProject,
        runProject,
        watchAndRunProject,
        restoreProject,
        openProject,
        addNugetPackages,
        removeNugetPackages,
        addProjectToSolution,
        addAllProjectsToSolution
    );
}
