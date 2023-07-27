import * as vscode from "vscode";
import { DotnetManager } from "../ProjectManager/ProjectManager";
import { DotnetProjectsProvider } from "../SideView/Dotnet/DotnetProjectsProvider";
import { NugetStack } from "../SideView/Dotnet/TreeItems/NugetStack";
import { NugetPackage } from "../SideView/Dotnet/TreeItems/NugetPackage";
import { DotnetProject } from "../SideView/Dotnet/TreeItems/DotnetProject";
import { ProjectStack } from "../SideView/Dotnet/TreeItems/ProjectStack";
import { extension } from "../GlobalConst";
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
        `${extension.id}.manageReferences`,
        async (clicker: vscode.Uri | DotnetProject | ProjectStack) => {
            logger.logInfo(`Command ${extension.id}.manageReferences called`);
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
        `${extension.id}.buildProject`,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(`Command ${extension.id}.buildProject called`);
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
        `${extension.id}.runProject`,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(`Command ${extension.id}.runProject called`);
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
        `${extension.id}.watchAndRunProject`,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(`Command ${extension.id}.watchAndRunProject called`);
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
        `${extension.id}.restoreProject`,
        async (clicker: vscode.Uri | DotnetProject) => {
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
        `${extension.id}.openProject`,
        async (clicker: vscode.Uri | DotnetProject) => {
            logger.logInfo(`Command ${extension.id}.openProject called`);
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
        `${extension.id}.addNugetPackage`,
        async (clicker: NugetStack | DotnetProject) => {
            logger.logInfo(
                `Command ${extension.id}.manageNugetPackages called`
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
        `${extension.id}.removeNugetPackage`,

        async (clicker: NugetPackage | NugetStack) => {
            logger.logInfo(
                `Command ${extension.id}.manageNugetPackages called`
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
        `${extension.id}.dotnetProjects`,
        dotnetProjectsTreeView
    );

    let refreshNugetTreeView = vscode.commands.registerCommand(
        `${extension.id}.refreshDotnetTreeView`,
        async () => {
            logger.logInfo(
                `Command ${extension.id}.refreshNugetTreeView called`
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
