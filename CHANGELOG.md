# Dotnet Tools

Any important change to this extension will be listed here.

## [1.6.2] - 2024-02-18 : Security update

- Updated packages.

## [1.6.1] - 2023-11-17 : Security update

- Security update

## [1.6.0] - 2023-10-11 : General improvements

- Added sln add solution
- Added: Add all the `csproj` to the current solution
- Added missing Nuget context menu for `csproj` files

## [1.5.0] - 2023-09-24 : Bug fix

- Added support for localizations
  - Extension localized to Spanish
- Fixed wrong name for `Node Dependencies` in `package.json` and other dependent files.

## [1.3.0] - 2023-09-02 : Bug fix

- Fixed the nuget package selector did not accept special characters, which is allow for nuget names.
- Fixed: Commands were not wrapped in a try-catch block, so errors were thrown to the user, not to the logger class.

## [1.2.0] - 2023-08-03 : Bug fix

- Fixed Node dependencies tree view: Now working.
- Remove a duplicate folder containing multiple duplicate files.
- Node dependencies are detected even if the project is not in the root folder.
- Fixed commands names to use const instead of string.

## [1.0.0] 2023-07-31 : Release

- Extension published.

---

Notes:

The date format is: YYYY-MM-DD
