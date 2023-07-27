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
