import { Uri } from "vscode";
import * as vscode from "vscode";
import { UserInteractions } from "../UserInteraction/UserInteractions";
import { fileExtensions, regex } from "../GlobalConst";
import path from "path";
import axios from "axios";
import { NugetPackage } from "../SideView/Dotnet/TreeItems/NugetPackage";
import { logger, terminal } from "../extension";

/**
 * ProjectManager class is responsible for managing dotnet projects
 * Adding/Removing/Updating projects
 * @class
 */
export class DotnetManager {
    static async createNewSolution(clicker: Uri | undefined) {
        let location = "";
        logger.logInfo(`Location: ${clicker?.fsPath}`);

        if (clicker === undefined) {
            const folders = vscode.workspace.workspaceFolders;
            if (folders === undefined) {
                logger.logError("No workspace folders found");
                vscode.window.showErrorMessage("No workspace folders found");
                throw new Error("No workspace folders found");
            }
            if (folders.length === 1) {
                location = folders[0].uri.fsPath;
            } else {
                let folder = await vscode.window.showQuickPick(
                    folders.map((folder) => {
                        return {
                            label: folder.name,
                            detail: folder.uri.fsPath,
                        };
                    }),
                    {
                        placeHolder:
                            "Select a folder to create the solution in",
                        canPickMany: false,
                        matchOnDetail: true,
                        matchOnDescription: true,
                        ignoreFocusOut: true,
                    }
                );
                if (folder === undefined) {
                    vscode.window.showErrorMessage("No folder selected");
                    throw new Error("No folder selected");
                }
                location = folder.detail;
            }
        } else {
            location = clicker.fsPath;
        }

        // Ask the user for the solution name, use the location as the default value
        let folderName = path.basename(location);
        vscode.window
            .showInputBox({
                placeHolder: "Enter the solution name",
                prompt: "Press enter when ready",
                value: folderName,
                ignoreFocusOut: true,
            })
            .then((solutionName) => {
                if (solutionName === undefined) {
                    vscode.window.showErrorMessage("No solution name provided");
                    throw new Error("No solution name provided");
                }
                // Run the dotnet new sln command
                terminal.sendCommands(
                    `cd "${location}"`,
                    `dotnet new sln -n ${solutionName}`
                );
            });
    }

    static openProject(clicker: Uri) {
        vscode.window.showTextDocument(clicker);
    }
    /**
     * Find all dotnet projects in the current workspace
     * @returns A promise that resolves to an array of Uri objects, can be empty
     */
    static async findDotnetProjects(): Promise<Uri[]> {
        logger.logInfo(`Searching for projects in the current workspace`);
        // Search for projects in the current directory
        // Projects are identified by the presence of a .csproj file or a .fsproj file
        // If a project is found, add it to the list of projects

        let projects: Uri[] = [];
        let csprojFiles = vscode.workspace.findFiles("**/*.csproj");
        let fsprojFiles = vscode.workspace.findFiles("**/*.fsproj");

        for (let csprojFile of await csprojFiles) {
            projects.push(csprojFile);
        }
        for (let fsprojFile of await fsprojFiles) {
            projects.push(fsprojFile);
        }
        logger.logInfo(`Found ${projects.length} projects`);
        return projects;
    }
    /**
     * Find all dotnet projects in the current workspace
     * @returns A promise that resolves to an array of Uri objects, can be empty
     */
    static async findDotnetSolutions(): Promise<Uri[]> {
        logger.logInfo(`Searching for solution files in the current workspace`);

        let solutions = await vscode.workspace.findFiles("**/*.sln");

        logger.logInfo(`Found ${solutions.length} projects`);
        return solutions;
    }

    /**
     * This function adds one or more references to a project
     * @param clicker The project to add the reference to
     * @returns void
     */
    static async manageReferences(clicker: Uri) {
        try {
            let projects: vscode.Uri[] =
                await DotnetManager.findDotnetProjects();
            let projectsAvailableToReference: vscode.Uri[] = [];
            let mainProject: vscode.Uri;

            // Check if there are enough projects to choose from
            if (projects.length === 0) {
                throw new Error(`No projects found in the current workspace`);
            }
            // If the clicker is undefined, ask the user to select a project
            if (clicker === undefined) {
                mainProject = await UserInteractions.selectSingleProject(
                    projects
                );
            } else {
                mainProject = clicker;
            }

            logger.logInfo(`Managing references for ${mainProject.fsPath}`);

            // Remove the main project from the list of projects
            projectsAvailableToReference = projects.filter(
                (project) => project.fsPath !== mainProject.fsPath
            );
            // Remove the projects that are already referenced
            let referencedProjects = await DotnetManager.getReferencedProjects(
                mainProject
            );

            // Split the projects into two arrays, one with the projects that are already referenced and one with the projects that are not referenced
            projectsAvailableToReference =
                DotnetManager.removeDuplicateProjects(
                    projectsAvailableToReference,
                    referencedProjects
                );
            let projectsAlreadyReferenced =
                DotnetManager.removeDuplicateProjects(
                    referencedProjects,
                    projectsAvailableToReference
                );
            logger.logInfo(
                `Found ${projectsAvailableToReference.length} projects available to reference`
            );
            logger.logInfo(
                `Found ${projectsAlreadyReferenced.length} projects already referenced`
            );

            // Map the projects to a QuickPickItem array, include the projects that are already referenced, already selected
            let projectMap = DotnetManager.mapProjects(
                projectsAvailableToReference
            );
            projectMap = projectMap.concat(
                DotnetManager.mapProjects(projectsAlreadyReferenced, true)
            );

            logger.logInfo(`Asking the user to manage references`);
            // Ask the user to select all the projects they want to reference
            let userModifications =
                await UserInteractions.selectMultipleProject(projectMap);

            // compare the user selections to the projects that are already referenced
            let projectsToAdd: Uri[] = [];
            let projectsToRemove: Uri[] = [];
            for (let userAdd of userModifications.selectedProjects) {
                // if the userAdd is already in the referenced projects, skip it
                // otherwise, add it to the projectsToAdd array
                if (
                    !projectsAlreadyReferenced.some(
                        (project) => project.fsPath === userAdd.fsPath
                    )
                ) {
                    projectsToAdd.push(userAdd);
                }
            }
            for (let userRemove of userModifications.unselectedProjects) {
                // is the userRemove is in the referenced projects, add it to the projectsToRemove array
                // otherwise, skip it
                let remStrings = projectsAlreadyReferenced.map((project) => {
                    return project.fsPath;
                });
                if (remStrings.includes(userRemove.fsPath)) {
                    projectsToRemove.push(userRemove);
                }
            }

            if (projectsToAdd.length === 0 && projectsToRemove.length === 0) {
                logger.logInfo(`No changes to make to ${mainProject.fsPath}`);
                throw new Error(`No changes to make to ${mainProject.fsPath}`);
            } else if (projectsToAdd.length >= 1) {
                logger.logInfo(
                    `The user selected ${projectsToAdd.length} projects to add`
                );
            } else if (projectsToRemove.length >= 1) {
                logger.logInfo(
                    `The user selected ${projectsToRemove.length} projects to remove`
                );
            }

            terminal.modifyLocalReferences(
                mainProject,
                projectsToAdd,
                projectsToRemove
            );

            logger.logInfo(`Process completed`);
            logger.logEnd();
        } catch (error) {
            if (error instanceof Error) {
                logger.logError(error.message);
                logger.logError(`Process failed`);
                logger.logEnd();
            } else {
                logger.logError(`Process failed`);
                logger.logError(`A mysterious error occurred`);
                logger.logEnd();
            }
        }
    }

    /**
     * Returns an array of projects referenced by the project at the given uri
     * @param uri
     * @returns
     */
    static async getReferencedProjects(uri: Uri): Promise<Uri[]> {
        // Read the .csproj file and return the contents in the <ItemGroup> tag
        let projectFile = await vscode.workspace.fs.readFile(uri);
        let projectFileString = Buffer.from(projectFile).toString();
        let paths: string[] = [];
        let match;
        while ((match = regex.itemGroupRegex.exec(projectFileString))) {
            const itemGroup = match[1];
            while ((match = regex.localPaths.exec(itemGroup))) {
                const localPath = match[1];
                const fullPath = this.resolveLocalPath(uri, localPath);
                paths.push(fullPath);
            }
        }
        paths = paths.filter((path) => {
            return (
                path.endsWith(fileExtensions.csproj) ||
                path.endsWith(fileExtensions.fsproj)
            );
        });
        return paths.map((path) => Uri.file(path));
    }
    /**
     * Resolve the local path to a full path, relative to the project file
     * @param uri The uri of the project file
     * @param localPath The local path to resolve
     * @returns The full path
     */
    private static resolveLocalPath(uri: Uri, localPath: string): string {
        const upDirs = localPath.match(/\.\.\//g)?.length || 0;
        const uriPath = uri.path
            .split("/")
            .slice(0, -upDirs - 1)
            .join("/");
        const fullPath = Uri.joinPath(
            uri.with({ path: uriPath }),
            localPath.replace(/\.\.\//g, "")
        ).fsPath;
        return fullPath;
    }
    /**
     * Remove the projects that are in the second array from the first array
     * @param projects
     * @param projectsToRemove
     * @returns
     */
    static removeDuplicateProjects(
        projects: Uri[],
        projectsToRemove: Uri[]
    ): Uri[] {
        // convert the projects to remove to a string array
        let projectsToRemoveString = projectsToRemove.map((project) => {
            return project.fsPath;
        });
        let projectsAvailableToReference = projects.filter((project) => {
            return !projectsToRemoveString.includes(project.fsPath);
        });
        return projectsAvailableToReference;
    }

    /**
     * Convert an array of Uri objects to an array of QuickPickItem objects
     * @param projects
     */
    static mapProjects(
        projects: Uri[],
        picked = false
    ): vscode.QuickPickItem[] {
        let uriMap: vscode.QuickPickItem[] = [];
        for (let project of projects) {
            uriMap.push({
                label: this.getFileNameWithoutExtension(project.fsPath),
                detail: project.fsPath,
                description:
                    path.extname(project.fsPath) === ".csproj"
                        ? "C# project"
                        : "F# project",
                picked: picked,
            });
        }
        return uriMap;
    }

    static getFileNameWithoutExtension(filePath: string): string {
        return path.basename(filePath, path.extname(filePath));
    }

    static buildProject(clicker: Uri) {
        let projectPath = path.dirname(clicker.fsPath);

        terminal.sendCommands(`cd ${projectPath}`, `dotnet build`);
    }
    static runProject(clicker: Uri) {
        let projectPath = path.dirname(clicker.fsPath);
        terminal.sendCommands(`cd "${projectPath}"`, `dotnet run`);
        // terminal.sendPathCommand(projectPath);
        // terminal.sendCommand(`dotnet run`);
    }
    static watchAndRunProject(clicker: Uri) {
        let projectPath = path.dirname(clicker.fsPath);
        terminal.sendCommands(`cd "${projectPath}"`, `dotnet watch run`);
        // terminal.sendPathCommand(projectPath);
        // terminal.sendCommand(`dotnet watch run`);
    }
    static restoreProject(clicker: Uri) {
        let projectPath = path.dirname(clicker.fsPath);
        terminal.sendCommands(`cd "${projectPath}"`, `dotnet restore`);
    }
    public static selectProject(projects: Promise<Uri[]>): Promise<Uri> {
        return new Promise(async (resolve, reject) => {
            try {
                let projectArray = await projects;
                if (projectArray.length === 0) {
                    vscode.window.showErrorMessage("No project(s) were found!");
                    throw new Error("No project(s) were found");
                }
                let userSelection = await vscode.window.showQuickPick(
                    projectArray.map((project) => {
                        return {
                            label: this.getFileNameWithoutExtension(
                                project.fsPath
                            ),
                            detail: project.fsPath,
                            description:
                                path.extname(project.fsPath) === ".csproj"
                                    ? "C# project"
                                    : "F# project",
                        };
                    }),
                    {
                        placeHolder: "Select a project",
                        canPickMany: false,
                        matchOnDescription: true,
                        matchOnDetail: true,
                        ignoreFocusOut: true,
                    }
                );
                if (userSelection !== undefined) {
                    resolve(Uri.file(userSelection.detail));
                }
            } catch (
                /* istanbul ignore next */
                error
            ) {
                reject(error);
            }
        });
    }
    public static selectSolution(projects: Promise<Uri[]>): Promise<Uri> {
        return new Promise(async (resolve, reject) => {
            try {
                let projectArray = await projects;
                if (projectArray.length === 0) {
                    vscode.window.showErrorMessage(
                        "No solution file(s) were found!"
                    );
                    throw new Error("No solution files(s) were found");
                }
                let userSelection = await vscode.window.showQuickPick(
                    projectArray.map((project) => {
                        return {
                            label: this.getFileNameWithoutExtension(
                                project.fsPath
                            ),
                            detail: project.fsPath,
                            description: "sln",
                        };
                    }),
                    {
                        placeHolder: "Select a solution",
                        canPickMany: false,
                        matchOnDescription: true,
                        matchOnDetail: true,
                        ignoreFocusOut: true,
                    }
                );
                if (userSelection !== undefined) {
                    resolve(Uri.file(userSelection.detail));
                }
            } catch (
                /* istanbul ignore next */
                error
            ) {
                reject(error);
            }
        });
    }

    public static async getNugetPackages(
        project: vscode.Uri
    ): Promise<NugetPackage[]> {
        // Read the .csproj file and return the contents in the <ItemGroup> tag
        let projectFile = await vscode.workspace.fs.readFile(project);
        let projectFileString = Buffer.from(projectFile).toString();
        let packages: NugetPackage[] = [];
        const regex = {
            localPaths: /(\.\.\/)+/g,
            itemGroupRegex: /<ItemGroup\s*>([\s\S]*?)<\/ItemGroup>/gs,
            nugetPackage:
                /<PackageReference\s+Include\s*=\s*"([\w\.]+)"\s+Version\s*=\s*"([\d\w\.\-]+)"(.*?)\/?>/gs,
        };
        let match;
        while ((match = regex.itemGroupRegex.exec(projectFileString))) {
            const itemGroup = match[1];
            while ((match = regex.nugetPackage.exec(itemGroup))) {
                const packageName = match[1];
                const version = match[2];

                packages.push(
                    new NugetPackage(
                        packageName,
                        version,
                        vscode.TreeItemCollapsibleState.None,
                        project,
                        "",
                        [],
                        []
                    )
                );
            }
        }
        return packages;
    }
    public static async getNugetPackageVersions(
        packageName: string
    ): Promise<string[]> {
        const url = `https://api.nuget.org/v3-flatcontainer/${packageName}/index.json`;
        // use axios to get the response
        const response = await axios.get(url);
        const json = response.data;
        const versions = json.versions as string[];
        return versions;
    }
    public static async searchNugetPackage(
        packageName: string
    ): Promise<NugetPackage[]> {
        // gets only 10 results
        const url = `https://azuresearch-usnc.nuget.org/query?q=${packageName}&prerelease=true&take=10`;

        // use axios to get the response
        const response = await axios.get(url);
        const json = response.data;
        const data = json.data as any[];
        const packages = data.map((packageData: any) => {
            return new NugetPackage(
                packageData.id,
                packageData.version,
                vscode.TreeItemCollapsibleState.None,
                vscode.Uri.file(""),
                packageData.description,
                packageData.versions,
                packageData.authors
            );
        });
        return packages;
    }
    public static async addNugetPackage(project: Uri) {
        // adding a nuget package requires the following steps:
        // 1. search for the package
        // 2. select the package
        // 3. select the version
        // 4. add the package to the project
        try {
            let projectName = path.basename(project.fsPath, ".csproj");
            // 1. search for the package

            //  ask the user for the package name,
            const packageName = await vscode.window.showInputBox({
                placeHolder:
                    "Search a Nuget Package in the Nuget.org repository",
                ignoreFocusOut: true,
                prompt: "Press enter when ready",
                title: `Adding Nuget Package to ${projectName}`,
                validateInput: (value) => {
                    // regex for the input not to be empty, not special characters and be at lest 4 characters long
                    const regex = /^.{4,}$/g;
                    if (regex.test(value)) {
                        return null;
                    }
                    return "Please enter at least 4 characters";
                },
            });
            if (packageName === undefined) {
                throw new Error("No package name provided");
            }
            // check if the packageName is valid, if not, throw an error

            const packages = await this.searchNugetPackage(packageName);
            if (packages.length === 0) {
                vscode.window.showErrorMessage(
                    `No packages found for ${packageName}`
                );
                throw new Error("No packages found");
            }
            // 2. select the package
            const selectedPackage = await vscode.window.showQuickPick(
                packages.map((packageData) => {
                    return {
                        label: packageData.label,
                        detail: packageData.description,
                        description: packageData.version,
                    };
                }),
                {
                    placeHolder: "Select a package",
                    canPickMany: false,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    ignoreFocusOut: true,
                }
            );
            if (selectedPackage === undefined) {
                throw new Error("No package selected");
            }
            // 3. select the version
            const versions = await this.getNugetPackageVersions(
                selectedPackage.label
            );

            const selectedVersion = await vscode.window.showQuickPick(
                versions
                    .map((version) => {
                        return {
                            label: version,
                            detail: selectedPackage.label,
                        };
                    })
                    .sort((a, b) => {
                        return b.label.localeCompare(a.label);
                    }),
                {
                    placeHolder: `Select a version, recommended: ${selectedPackage.description}`,
                    canPickMany: false,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    ignoreFocusOut: true,
                    // fill the input box with the latest version
                }
            );
            if (selectedVersion === undefined) {
                throw new Error("No version selected");
            }
            // 4. add the package to the project
            let command = `dotnet add package ${selectedPackage.label} --version ${selectedVersion.label}`;
            logger.logInfo(`Waiting for user confirmation`);
            logger.logWarning(`The following command will be executed:`);
            logger.logWarning(command);
            // prompt the user to confirm
            const confirm = await vscode.window.showQuickPick(
                [
                    {
                        label: "Yes",
                        description: "Add the package",
                    },
                    {
                        label: "No",
                        description: "Cancel",
                    },
                ],
                {
                    placeHolder: `Confirm adding the package ${selectedPackage.label} version ${selectedVersion.label} to ${projectName}`,
                    canPickMany: false,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    ignoreFocusOut: true,
                }
            );
            if (confirm === undefined) {
                vscode.window.showInformationMessage(
                    `No worries, the package will not be added`
                );
                throw new Error("No confirmation");
            }
            if (confirm.label === "No") {
                vscode.window.showInformationMessage(
                    `As you wish, the package will not be added`
                );
                throw new Error("No confirmation");
            }
            // add the package
            terminal.sendCommands(
                `cd ${path.dirname(project.fsPath)}`,
                command
            );

            DotnetManager.buildProject(project);
        } catch (error) {
            if (error instanceof Error) {
                logger.logError(error.message);
                logger.logError(`Process failed`);
                logger.logEnd();
            } else {
                logger.logError(`Process failed`);
                logger.logError(`A mysterious error occurred`);
                logger.logEnd();
            }
        }
    }
    public static async addProjectToSolution(solution: Uri, addAll = false) {
        // Add one or more project files to a solution file
        // One: get the target sln file
        // Two: get the project(s) to add
        // Three: Run the command to add the necessary projects

        // let solutionName = path.basename(solution.fsPath, ".sln");
        let solutionPath = path.dirname(solution.fsPath);

        const availableProjects = await DotnetManager.findDotnetProjects();
        let projectMap = DotnetManager.mapProjects(availableProjects);

        let projectsToAdd: Uri[];

        if (addAll === false) {
            let selectedProjects = await UserInteractions.selectMultipleProject(
                projectMap
            );
            projectsToAdd = selectedProjects.selectedProjects;
        } else {
            projectsToAdd = availableProjects;
        }

        // Change the active directory to the solution file dir

        let command = `dotnet sln add `;
        terminal.sendCommands(`cd ${solutionPath}`);
        projectsToAdd.forEach((element) => {
            terminal.sendCommands(`${command} ${element.fsPath}`);
        });
    }
    public static async removeNugetPackage(project: Uri, nugetName?: string[]) {
        // if the project is a NugetPackage, simply run the remove command
        // remove the package
        let projectName = path.basename(project.fsPath, ".csproj");
        let projectPath = path.dirname(project.fsPath);
        if (nugetName === undefined) {
            // read the nuget packages from the project
            const packages = await this.getNugetPackages(project);
            if (packages.length === 0) {
                vscode.window.showErrorMessage(
                    `No packages found for ${projectName}`
                );
                throw new Error("No packages found");
            }
            // ask the user to select a package
            const selectedPackage = await vscode.window.showQuickPick(
                packages.map((packageData) => {
                    return {
                        label: packageData.label,
                        detail: packageData.description,
                        description: packageData.version,
                    };
                }),
                {
                    placeHolder: "Select a package",
                    canPickMany: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    ignoreFocusOut: true,
                }
            );
            if (selectedPackage === undefined) {
                vscode.window.showInformationMessage(
                    `No worries, the package will not be removed`
                );
                throw new Error("No package selected");
            }
            //
            nugetName = selectedPackage.map((packageData) => {
                return packageData.label;
            });
        }
        let command = `dotnet remove package `;
        logger.logInfo(`Waiting for user confirmation`);
        const confirm = await vscode.window.showQuickPick(
            [
                {
                    label: "Yes",
                    description: "Remove the package",
                },
                {
                    label: "No",
                    description: "Cancel",
                },
            ],
            {
                placeHolder: `Confirm removing the package ${nugetName} from ${projectName}`,
                canPickMany: false,
                matchOnDescription: true,
                matchOnDetail: true,
                ignoreFocusOut: true,
            }
        );
        if (confirm === undefined) {
            vscode.window.showInformationMessage(
                `No worries, the package will not be removed`
            );
            throw new Error("No confirmation");
        }
        if (confirm.label === "No") {
            vscode.window.showInformationMessage(
                `As you wish, the package will not be removed`
            );
            throw new Error("No confirmation");
        }
        // remove the package
        terminal.sendCommands(`cd ${projectPath}`);
        for (let packageToRemove of nugetName) {
            terminal.sendCommands(`${command}${packageToRemove}`);
        }
        DotnetManager.buildProject(project);
    }
}
