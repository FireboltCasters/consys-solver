<h2 align="center">
    npm-template
</h2>

<p align="center">
  <a href="https://badge.fury.io/js/packageName.svg"><img src="https://badge.fury.io/js/packageName.svg" alt="npm package" /></a>
  <a href="https://img.shields.io/github/license/organization/packageName"><img src="https://img.shields.io/github/license/organization/packageName" alt="MIT" /></a>
  <a href="https://img.shields.io/github/last-commit/organization/packageName?logo=git"><img src="https://img.shields.io/github/last-commit/organization/packageName?logo=git" alt="last commit" /></a>
  <a href="https://www.npmjs.com/package/packageName"><img src="https://img.shields.io/npm/dm/packageName.svg" alt="downloads week" /></a>
  <a href="https://www.npmjs.com/package/packageName"><img src="https://img.shields.io/npm/dt/packageName.svg" alt="downloads total" /></a>
  <a href="https://github.com/organization/packageName"><img src="https://shields.io/github/languages/code-size/organization/packageName" alt="size" /></a>
  <a href="https://david-dm.org/organization/packageName"><img src="https://david-dm.org/organization/packageName/status.svg" alt="dependencies" /></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2Forganization%2FpackageName?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Forganization%2FpackageName.svg?type=shield"/></a>
  <a href="https://github.com/google/gts" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/code%20style-google-blueviolet.svg"/></a>
  <a href="https://shields.io/" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/uses-TypeScript-blue.svg"/></a>
  <a href="https://github.com/marketplace/actions/lint-action"><img src="https://img.shields.io/badge/uses-Lint%20Action-blue.svg"/></a>
</p>

<p align="center">
  <a href="https://github.com/organization/packageName/actions/workflows/npmPublish.yml"><img src="https://github.com/organization/packageName/actions/workflows/npmPublish.yml/badge.svg" alt="Npm publish" /></a>
  <a href="https://github.com/organization/packageName/actions/workflows/linter.yml"><img src="https://github.com/organization/packageName/actions/workflows/linter.yml/badge.svg" alt="Build status" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=alert_status" alt="Quality Gate" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=bugs" alt="Bugs" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=coverage" alt="Coverage" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=code_smells" alt="Code Smells" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=duplicated_lines_density" alt="Duplicated Lines (%)" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=sqale_rating" alt="Maintainability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=reliability_rating" alt="Reliability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=security_rating" alt="Security Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=sqale_index" alt="Technical Debt" /></a>
  <a href="https://sonarcloud.io/dashboard?id=sonarProjectKey"><img src="https://sonarcloud.io/api/project_badges/measure?project=sonarProjectKey&metric=vulnerabilities" alt="Vulnerabilities" /></a>
</p>

<p align="center">
    npm-template
</p>

## About

A template for creating npm packages

## How to setup your project

First and most importantly, edit the setup.json file to match your project:

```javascript
{
  "package": {
    "name": "<packageName>",
    "description": "<packageDescription>",
    "keywords": [
      "npm-template"
    ],
    "repositoryURL": "https://github.com/FireboltCasters/npm-template.git",
    "author": "Steffen Droppelmann",
    "contributors": [
      {
        "name": "Nils Baumgartner",
        "email": "nilsbaumgartner1994@gmail.com",
        "url": "https://github.com/FireboltCasters"
      },
      {
        "name": "Steffen Droppelmann",
        "email": "steffen.droppelmann@gmail.com",
        "url": "https://github.com/FireboltCasters"
      }
    ],
    "license": "MIT"
  },
  "sonar": {
    "projectKey": "ExampleKey",
    "organization": "ExampleOrganization"
  }
}
```

Then, run the following command:
(Note: After running this command, the setup files will be deleted)

```
npm run setup
```

Thats it, everything should work now.

## Contributors

The FireboltCasters

<a href="https://github.com/organization/packageName"><img src="https://contrib.rocks/image?repo=organization/packageName" alt="Contributors" /></a>
