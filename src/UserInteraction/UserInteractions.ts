import * as vscode from "vscode";
import { DotnetManager } from "../ProjectManager/ProjectManager";
/**
 * Defines the UserInteractions class.
 * Show messages, confirmations, errors to the user and get user input.
 */
export class UserInteractions {
    /**
     * Show an information message to the user.
     * @param message The message to show
     */
    static showInfoMessage(message: string) {
        vscode.window.showInformationMessage(message);
    }
    static showErrorMessage(message: string) {
        vscode.window.showErrorMessage(message);
    }
    static showWarningMessage(message: string) {
        vscode.window.showWarningMessage(message);
    }
    static showInputBox(options: vscode.InputBoxOptions) {
        return vscode.window.showInputBox(options);
    }
    static async selectSingleProject(
        projects: vscode.Uri[]
    ): Promise<vscode.Uri> {
        // throw an error if there are no projects
        if (projects.length === 0) {
            this.showErrorMessage(`No projects found in the current workspace`);
            throw new Error(`No projects found in the current workspace`);
        }

        // Convert the array of projects to an array of strings
        let uriMap = DotnetManager.mapProjects(projects);

        // show the quick pick
        let selectedProject = await vscode.window.showQuickPick(uriMap, {
            placeHolder: `Select a project to add a reference to`,
            canPickMany: false,
            matchOnDescription: true,
            matchOnDetail: true,
        });

        // if selectedProject is not undefined, return the project path as a Uri
        if (selectedProject?.detail !== undefined) {
            return vscode.Uri.file(selectedProject.detail);
            // return vscode.Uri.file(selectedProject);
        } else {
            this.showErrorMessage(`No project selected`);
            throw new Error(`No project selected`);
        }
    }
    static async selectMultipleProject(allProjects: vscode.QuickPickItem[]) {
        // Throw an error if there are no projects to choose from
        if (allProjects.length === 0) {
            this.showErrorMessage(`No projects available to reference`);
            throw new Error(`No projects available to reference`);
        }

        // show the quick pick
        let userSelections = await vscode.window.showQuickPick(allProjects, {
            placeHolder: `Select the project you want to reference`,
            canPickMany: true,
            matchOnDescription: true,
            matchOnDetail: true,
            ignoreFocusOut: true,
        });

        if (userSelections === undefined) {
            this.showErrorMessage(`No project selected`);
            throw new Error(`No project selected`);
        }

        let allProjectsAsUri: vscode.Uri[] = [];
        let selectedProjects: vscode.Uri[] = [];
        let unselectedProjects: vscode.Uri[] = [];

        allProjects.forEach((project) => {
            allProjectsAsUri.push(vscode.Uri.file(project.detail!));
        });
        // remove the selected projects from the list of all projects
        userSelections.forEach((project) => {
            selectedProjects.push(vscode.Uri.file(project.detail!));
        });
        // remove the selected projects from the list of all projects
        let selectedProjectsAsStrings = selectedProjects.map((project) => {
            return project.fsPath;
        });
        unselectedProjects = allProjectsAsUri.filter((project) => {
            return !selectedProjectsAsStrings.includes(project.fsPath);
        });
        return { selectedProjects, unselectedProjects };
    }

    static async convertStringsToUri(uriAsString: string[]) {
        let uriMap = uriAsString.map((uri) => {
            return vscode.Uri.file(uri);
        });
        return uriMap;
    }
    static async selectAVersion(versions: string[]) {
        let selectedVersion = await vscode.window.showQuickPick(versions, {
            placeHolder: `Select a version to install`,
            canPickMany: false,
            matchOnDescription: true,
            matchOnDetail: true,
            ignoreFocusOut: true,
        });
        if (selectedVersion === undefined) {
            this.showErrorMessage(`No version selected`);
            throw new Error(`No version selected`);
        }
        return selectedVersion;
    }
}
