export const fileExtensions = {
    // csproj file extension
    csproj: ".csproj",
    // fsproj file extension
    fsproj: ".fsproj",
    // sln file extension
    sln: ".sln",
};
// export const

export const regex = {
    // Matches local paths in a csproj file
    localPaths: /Include="([^"]+)"/g,
    itemGroupRegex: /<ItemGroup>([\s\S]*?)<\/ItemGroup>/g,
};

/**
 * GlobalConst: Description of the constant.
 * Use this file to define constant values used throughout your project.
 */

export const extension = {
    id: `dotnet-tools`,
    name: `.NET Tools`,
};
