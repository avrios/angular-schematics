"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const parse_name_1 = require("../utilities/parse-name");
const project_1 = require("../utilities/project");
const validation_1 = require("../utilities/validation");
function default_1(options) {
    const angularConfigFile = '/angular.json';
    const nxConfigFile = '/nx.json';
    return (host) => {
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option (project) is required.');
        }
        const project = project_1.getProject(host, options.project);
        if (options.path === undefined) {
            options.path = project_1.buildDefaultPath(project);
        }
        const parsedPath = parse_name_1.parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        validation_1.validateName(options.name);
        const workspaceConfig = host.read(angularConfigFile);
        const nxWorkspaceConfig = host.read(nxConfigFile);
        if (!workspaceConfig) {
            throw new schematics_1.SchematicsException('Could not find Angular worspace configuration.');
        }
        if (!nxWorkspaceConfig) {
            throw new schematics_1.SchematicsException('Could not find NX worspace configuration.');
        }
        const workspaceContent = workspaceConfig.toString();
        const nxWorkspaceContent = nxWorkspaceConfig.toString();
        const workspace = JSON.parse(workspaceContent);
        const nxWorkspace = JSON.parse(nxWorkspaceContent);
        workspace.projects[options.name] = {
            root: options.path,
            sourceRoot: options.path + '/src',
            projectType: 'library',
            schematics: {},
            prefix: options.prefix || 'avr',
            architect: {
                lint: {
                    builder: '@angular-devkit/build-angular:tslint',
                    options: {
                        tsConfig: [
                            options.path + '/tsconfig.lib.json',
                            options.path + '/tsconfig.spec.json',
                            options.path + '.storybook/tsconfig.json' // libs/shared/.storybook/tsconfig.json
                        ],
                        exclude: [
                            '**/node_modules/**',
                            '!' + options.path + '/**/*' // !libs/shared/**/*
                        ]
                    }
                },
                test: {
                    builder: '@nrwl/jest:jest',
                    options: {
                        jestConfig: options.path + '/jest.config.js',
                        passWithNoTests: true
                    }
                }
            }
        };
        nxWorkspace.projects[options.name] = {
            tags: []
        };
        host.overwrite(angularConfigFile, JSON.stringify(workspace));
        host.overwrite(nxConfigFile, JSON.stringify(nxWorkspace));
        const templateSource = schematics_1.apply(schematics_1.url('./files'), [
            options.skipTests ? schematics_1.filter(path => !path.endsWith('.spec.ts.template')) : schematics_1.noop(),
            schematics_1.applyTemplates(Object.assign({}, core_1.strings, options)),
            schematics_1.move(parsedPath.path),
        ]);
        return schematics_1.chain([
            _ => host,
            schematics_1.mergeWith(templateSource)
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map