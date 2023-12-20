"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const validation_1 = require("../utilities/validation");
const parse_name_1 = require("../utilities/parse-name");
function default_1(options) {
    return (host) => {
        const projectJsonFile = '/project.json';
        const { prefix, project, skipStartConfig, tags: tagsString } = options;
        const dasherizedName = core_1.strings.dasherize(project);
        const parsedPath = (0, parse_name_1.parseName)(`libs/${dasherizedName}`, project);
        (0, validation_1.validateName)(parsedPath.name);
        const projectLibsRoot = parsedPath.path;
        const tags = tagsString ? tagsString.split(',').map(s => s.trim()) : [];
        const libraryNames = host.getDir(projectLibsRoot).subdirs;
        libraryNames.forEach(libraryName => {
            (0, validation_1.validateName)(libraryName);
            const sourceRoot = `${projectLibsRoot}/src/lib/${libraryName}`;
            const projectConfig = {
                sourceRoot,
                prefix,
                tags,
                projectType: 'library',
                generators: {},
                targets: {
                    lint: {
                        executor: '@nrwl/linter:eslint',
                        options: {
                            lintFilePatterns: [
                                `${sourceRoot}/**/*.ts`,
                                `${sourceRoot}/**/*.html`
                            ],
                            eslintConfig: `${projectLibsRoot}/.eslintrc.json`
                        }
                    },
                    test: {
                        executor: '@nrwl/jest:jest',
                        options: {
                            jestConfig: `${projectLibsRoot}/jest.config.ts`,
                            passWithNoTests: true,
                            testPathPattern: [`lib/${libraryName}/`]
                        }
                    }
                }
            };
            host.exists(`${projectLibsRoot}/${libraryName}/${projectJsonFile}`) || host.create(`${projectLibsRoot}/${libraryName}/${projectJsonFile}`, JSON.stringify(projectConfig));
        });
        options.project = parsedPath.name;
        options.path = parsedPath.path;
        const rules = [
            (_) => host
        ];
        if (!skipStartConfig) {
            rules.push((0, schematics_1.apply)((0, schematics_1.url)('./files'), [
                (0, schematics_1.applyTemplates)(Object.assign(Object.assign({}, core_1.strings), options)),
                (0, schematics_1.move)(projectLibsRoot)
            ]));
        }
        return (0, schematics_1.chain)(rules);
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map