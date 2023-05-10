"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const parse_name_1 = require("../utilities/parse-name");
const validation_1 = require("../utilities/validation");
function default_1(options) {
    const angularConfigFile = '/angular.json';
    const nxConfigFile = '/nx.json';
    const tsBaseFile = '/tsconfig.base.json';
    return (host) => {
        const dasherizedName = core_1.strings.dasherize(options.name);
        const libSrcPath = `libs/shared/src/lib/${dasherizedName}`;
        const parsedPath = (0, parse_name_1.parseName)(libSrcPath, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        (0, validation_1.validateName)(options.name);
        const workspaceConfig = host.read(angularConfigFile);
        const nxWorkspaceConfig = host.read(nxConfigFile);
        const tsConfig = host.read(tsBaseFile);
        if (!workspaceConfig) {
            throw new schematics_1.SchematicsException('Could not find Angular workspace configuration.');
        }
        if (!nxWorkspaceConfig) {
            throw new schematics_1.SchematicsException('Could not find NX workspace configuration.');
        }
        const workspaceContent = workspaceConfig.toString();
        const nxWorkspaceContent = nxWorkspaceConfig.toString();
        const workspace = JSON.parse(workspaceContent);
        const nxWorkspace = JSON.parse(nxWorkspaceContent);
        const libId = `shared-${dasherizedName}`;
        workspace.projects[libId] = {
            root: `${libSrcPath}/${dasherizedName}`,
            sourceRoot: `${libSrcPath}/${dasherizedName}`,
            projectType: 'library',
            schematics: {},
            prefix: 'avr',
            architect: {
                lint: {
                    builder: '@angular-devkit/build-angular:tslint',
                    options: {
                        tsConfig: [
                            'libs/shared/tsconfig.lib.json',
                            'libs/shared/tsconfig.spec.json'
                        ],
                        exclude: [
                            '**/node_modules/**',
                            '!libs/shared/**/*'
                        ]
                    }
                },
                test: {
                    builder: '@nrwl/jest:jest',
                    options: {
                        jestConfig: `libs/shared/jest.config.js`,
                        passWithNoTests: true,
                        testPathPattern: [`lib/${dasherizedName}/`]
                    }
                }
            }
        };
        nxWorkspace.projects[libId] = {
            tags: []
        };
        if (tsConfig) {
            const tsConfigContent = tsConfig.toString();
            const tsConfigParsed = JSON.parse(tsConfigContent);
            if (!tsConfigParsed.compilerOptions.paths) {
                tsConfigParsed.compilerOptions.paths = {};
            }
            tsConfigParsed.compilerOptions.paths[`@shared/${dasherizedName}/*`] = [`libs/shared/src/lib/${dasherizedName}/*`];
            host.overwrite(tsBaseFile, JSON.stringify(tsConfigParsed, null, 2));
        }
        else {
            console.log('Could not find ./tsconfig.base.json configuration. Skipping...');
        }
        host.overwrite(angularConfigFile, JSON.stringify(workspace));
        host.overwrite(nxConfigFile, JSON.stringify(nxWorkspace, null, 2));
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            options.skipTests ? (0, schematics_1.filter)(path => !path.endsWith('.spec.ts.template')) : (0, schematics_1.noop)(),
            (0, schematics_1.applyTemplates)(Object.assign(Object.assign({}, core_1.strings), options)),
            (0, schematics_1.move)(parsedPath.path),
        ]);
        return (0, schematics_1.chain)([
            _ => host,
            (0, schematics_1.mergeWith)(templateSource)
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map