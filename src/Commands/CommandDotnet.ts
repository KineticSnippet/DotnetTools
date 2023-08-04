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

/**
 * CommandDotnet: Description of the function.
 *
 * @param paramName paramDescription
 */

// listener for dotnet project changes
const watcher = vscode.workspace.createFileSystemWatcher("**/*.csproj");

export function registerDotnetCommands(context: vscode.ExtensionContext) {
    let manageReferences = vscode.commands.registerCommand(
        dotnetCommands.manageReferences,
        async (clicker: vscode.Uri | DotnetProject | ProjectStack) => {
            logger.logInfo(
                `Command ${dotnetCommands.manageReferences}.manageReferences called`
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
    let buildProject = vscode.commands.registerCommand(
        dotnetCommands.buildProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(
                `Command ${dotnetCommands.buildProject}.buildProject called`
            );
            const project = DotnetManager.findDotnetProjects();
            if (clicker === undefined) {
                clicker = await DotnetManager.selectProject(project);
            }
            if (clicker instanceof DotnetProject) {
                clicker = clicker.project;
            }
            DotnetManager.buildProject(clicker);
        }
    );
    let runProject = vscode.commands.registerCommand(
        dotnetCommands.runProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(
                `Command ${dotnetCommands.runProject}.runProject called`
            );
            const project = DotnetManager.findDotnetProjects();
            if (clicker === undefined) {
                clicker = await DotnetManager.selectProject(project);
            }
            if (clicker instanceof DotnetProject) {
                clicker = clicker.project;
            }
            DotnetManager.runProject(clicker);
        }
    );
    let watchAndRunProject = vscode.commands.registerCommand(
        dotnetCommands.watchAndRunProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(
                `Command ${dotnetCommands.watchAndRunProject}.watchAndRunProject called`
            );
            const project = DotnetManager.findDotnetProjects();
            if (clicker === undefined) {
                clicker = await DotnetManager.selectProject(project);
            }
            if (clicker instanceof DotnetProject) {
                clicker = clicker.project;
            }
            DotnetManager.watchAndRunProject(clicker);
        }
    );
    let restoreProject = vscode.commands.registerCommand(
        dotnetCommands.restoreProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(
                `Command ${dotnetCommands.restoreProject}.restoreProject called`
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
        }
    );
    let openProject = vscode.commands.registerCommand(
        dotnetCommands.openProject,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(
                `Command ${dotnetCommands.openProject}.openProject called`
            );
            if (clicker === undefined) {
                const project = DotnetManager.findDotnetProjects();
                clicker = await DotnetManager.selectProject(project);
            } else if (clicker instanceof DotnetProject) {
                clicker = clicker.project;
            }
            DotnetManager.openProject(clicker);
        }
    );
    let addNugetPackages = vscode.commands.registerCommand(
        dotnetCommands.addNugetPackage,
        async (clicker: NugetStack | DotnetProject) => {
            logger.logInfo(
                `Command ${dotnetCommands.addNugetPackage}.addNugetPackage called`
            );
            let projectToAddPackage: vscode.Uri | undefined;
            if (clicker === undefined) {
                projectToAddPackage = await DotnetManager.selectProject(
                    DotnetManager.findDotnetProjects()
                );
            } else {
                projectToAddPackage = clicker.project;
            }
            DotnetManager.addNugetPackage(projectToAddPackage);
            logger.logInfo("Managing nuget packages");
        }
    );
    let removeNugetPackages = vscode.commands.registerCommand(
        dotnetCommands.removeNugetPackage,
        async (clicker: NugetPackage | NugetStack) => {
            logger.logInfo(
                `Command ${dotnetCommands.removeNugetPackage}.removeNugetPackage called`
            );
            if (clicker instanceof NugetPackage) {
                // if we receive a NugetPackage, we know which project to remove the package from
                DotnetManager.removeNugetPackage(clicker.project, [
                    clicker.label,
                ]);
            } else if (clicker instanceof NugetStack) {
                DotnetManager.removeNugetPackage(clicker.project);
            } else {
                const projectToRemovePackage =
                    await DotnetManager.selectProject(
                        DotnetManager.findDotnetProjects()
                    );
                DotnetManager.removeNugetPackage(projectToRemovePackage);
            }
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

    logger.logInfo("Extension activated");
    context.subscriptions.push(refreshNugetTreeView);
    context.subscriptions.push(
        manageReferences,
        buildProject,
        runProject,
        watchAndRunProject,
        restoreProject,
        openProject,
        addNugetPackages,
        removeNugetPackages
    );
}
