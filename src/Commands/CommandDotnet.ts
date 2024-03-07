import * as vscode from "vscode";
import { DotnetManager } from "../ProjectManager/ProjectManager";
import { DotnetProjectsProvider } from "../SideView/Dotnet/DotnetProjectsProvider";
import { NugetStack } from "../SideView/Dotnet/TreeItems/NugetStack";
import { NugetPackage } from "../SideView/Dotnet/TreeItems/NugetPackage";
import { DotnetProject } from "../SideView/Dotnet/TreeItems/DotnetProject";
import { ProjectStack } from "../SideView/Dotnet/TreeItems/ProjectStack";
import {
    dotnetProjectCommands,
    dotnetSolutionCommands,
    dotnetTreeViewCommands,
    treeViewNames,
} from "../GlobalConst";
import { logger } from "../extension";

// listener for dotnet project changes
const watcher = vscode.workspace.createFileSystemWatcher("**/*.csproj");

export function registerDotnetCommands(context: vscode.ExtensionContext) {
    // * Commands for managing .NET solutions (sln files)

    const addSolutionFile = vscode.commands.registerCommand(
        dotnetSolutionCommands.addSolutionFile,
        async (clicker: vscode.Uri | undefined) => {
            logger.logInfo(
                `Command ${dotnetSolutionCommands.addSolutionFile} called`
            );
            await DotnetManager.createNewSolution(clicker);
        }
    );

    //  * Commands for managing .NET projects (csproj files)

    // Add or remove references from a csproj file
    const manageReferences = vscode.commands.registerCommand(
        dotnetProjectCommands.manageReferences,
        async (clicker: vscode.Uri | DotnetProject | ProjectStack) => {
            logger.logInfo(
                `Command ${dotnetProjectCommands.manageReferences} called`
            );
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
        dotnetProjectCommands.buildProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.buildProject} called`
                );
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
        dotnetProjectCommands.runProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.runProject} called`
                );
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
        dotnetProjectCommands.watchAndRunProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.watchAndRunProject} called`
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
        dotnetProjectCommands.restoreProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.restoreProject} called`
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
        dotnetProjectCommands.openProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.openProject} called`
                );
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
        dotnetProjectCommands.addNugetPackage,
        async (clicker: NugetStack | DotnetProject | vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.addNugetPackage} called`
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
        dotnetProjectCommands.removeNugetPackage,
        async (clicker: NugetPackage | NugetStack | vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.removeNugetPackage} called`
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
        dotnetProjectCommands.addProjectToSln,
        async (clicker: vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.addProjectToSln} called`
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
        dotnetProjectCommands.addAllProjectsToSln,
        async (clicker: vscode.Uri) => {
            try {
                logger.logInfo(
                    `Command ${dotnetProjectCommands.addProjectToSln} called`
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
        // * Commands for managing .NET solutions (sln files)
        addSolutionFile,

        // * Commands for managing .NET projects (csproj files)
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
