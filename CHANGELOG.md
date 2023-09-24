# Dotnet Tools

Any important change to this extension will be listed here.

## [1.4.0] - 2023-09-24

- Added support for localizations
  - Extension localized to Spanish
- Fixed wrong name for `Node Dependencies` in `package.json` and other dependent files.

## [1.3.0] - 2023-09-02

- Fixed the nuget package selector did not accept special characters, which is allow for nuget names.
- Fixed: Commands where not wrapped in a try-catch block, so errors where thrown to the user, not to the logger class.

## [1.2.0] - 2023-08-03

- Fixed Node dependencies tree view: Now working.
- Remove a duplicate folder containing multiple duplicate files.
- Node dependencies are detected even if the project is not in the root folder.
- Fixed commands names to use const instead of string.

## [1.0.0] 2023-07-31

- Extension published.

---

Notes:

The date format is: YYYY-MM-DD
