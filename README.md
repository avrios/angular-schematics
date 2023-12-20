# Avrios Schematics for Angular
 
 ## Environment Setup
 ``npm install``
 
 ``npm run build``
 
 ## Generation schematics
 Generation schematics are instructions for the ``ng generate`` command. Avrios' Schematics [support custom API Services, components, modals, page components, ngrx store and library generation](https://github.com/avrios/angular-schematics/blob/master/src/collection.json).

 Usage example:
 ``ng generate avrios-schematics:component <component-name>``

## Schematic: library (deprecated)

## Schematic: extract-app-libs
Generates libraries for a specific Avrio's app scope.

### inputs:
- `**name:**` The name of the project this libraries belong to. If none given then the libraries are added to the the shared scope.
- `**namespace:**` The namespace of the Library. Normally matches the project name. Ex: `@secure, @shared``.
- `**tags:**` The list of tags the libraries are allowed to use.
- `**prefix:**` The prefix to apply to the generated libraries.

For this schematic to work you have to:
- extract the apps folders that you want to convert to libraries to the path libs/<app-name>/src/lib
- run `npm run ng generate avrios-schematics:extract-app-libs <app-name>`