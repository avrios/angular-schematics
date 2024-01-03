"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const validation_1 = require("../utilities/validation");
const parse_name_1 = require("../utilities/parse-name");
function default_1(options) {
    return (host) => {
        const projectJsonFile = '/project.json';
        const { prefix, name, tags: tagsString } = options;
        const dasherizedName = core_1.strings.dasherize(name);
        const projectLibsRoot = `libs/${dasherizedName}`;
        const parsedPath = (0, parse_name_1.parseName)(projectLibsRoot, name);
        (0, validation_1.validateName)(parsedPath.name);
        const appScope = `scope:${dasherizedName}`;
        const namespace = options.namespace ? options.namespace : parsedPath.name;
        const paths = {};
        const libraryNames = host.getDir(`${projectLibsRoot}/src/lib`).subdirs;
        libraryNames.forEach(libraryName => {
            (0, validation_1.validateName)(libraryName);
            const sourceRoot = `${projectLibsRoot}/src/lib/${libraryName}`;
            paths[`@${namespace}/${libraryName}/*`] = [`${projectLibsRoot}/src/lib/${libraryName}/*`];
            const projectConfig = {
                name: `${dasherizedName}-${libraryName}`,
                sourceRoot,
                prefix,
                tags: [appScope],
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
            host.exists(`${sourceRoot}/${projectJsonFile}`) || host.create(`${sourceRoot}/${projectJsonFile}`, JSON.stringify(projectConfig));
        });
        const appTsConfigPath = `apps/${dasherizedName}/tsconfig.json`;
        const appEslintrcPath = `apps/${dasherizedName}/.eslintrc.json`;
        const eslintrcPath = `/.eslintrc.json`;
        const appTsConfig = host.read(appTsConfigPath);
        const appEslintrc = host.read(appEslintrcPath);
        const eslintrc = host.read(eslintrcPath);
        if (!appTsConfig) {
            throw new schematics_1.SchematicsException(`Could not find ${dasherizedName}/tsConfig.json file.`);
        }
        if (!appEslintrc) {
            throw new schematics_1.SchematicsException(`Could not find ${dasherizedName}/.eslintrc.json file.`);
        }
        if (!eslintrc) {
            throw new schematics_1.SchematicsException(`Could not find /.eslintrc.json file.`);
        }
        // Add new libs paths to tsconfig.json
        const appTsConfigJson = JSON.parse(appTsConfig.toString());
        appTsConfigJson.compilerOptions.paths = Object.assign(Object.assign({}, paths), appTsConfigJson.compilerOptions.paths);
        // Remove deactivated eslint rule @nrwl/nx/enforce-module-boundaries rule from app's .eslintrc.json
        const appEslintrcJson = JSON.parse(appEslintrc.toString());
        appEslintrcJson.overrides.forEach((elem) => {
            if (elem.rules && elem.rules['@nrwl/nx/enforce-module-boundaries'] === 'off') {
                delete elem.rules['@nrwl/nx/enforce-module-boundaries'];
            }
        });
        const eslintrcJson = JSON.parse(eslintrc.toString());
        const tags = tagsString ? tagsString.split(',').map(s => s.trim()) : [];
        eslintrcJson.overrides.forEach((elem) => {
            if (elem.rules && elem.rules['@nrwl/nx/enforce-module-boundaries']) {
                const found = elem.rules['@nrwl/nx/enforce-module-boundaries'][1].depConstraints.filter((constraint) => constraint.sourceTag === appScope);
                if (!found || !found.length) {
                    elem.rules['@nrwl/nx/enforce-module-boundaries'][1].depConstraints.push({
                        sourceTag: appScope,
                        onlyDependOnLibsWithTags: [...tags, appScope]
                    });
                }
            }
        });
        host.overwrite(appTsConfigPath, JSON.stringify(appTsConfigJson));
        host.overwrite(appEslintrcPath, JSON.stringify(appEslintrcJson));
        host.overwrite(eslintrcPath, JSON.stringify(eslintrcJson));
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.namespace = namespace;
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            (0, schematics_1.applyTemplates)(Object.assign(Object.assign({}, core_1.strings), options)),
            (0, schematics_1.move)(projectLibsRoot),
        ]);
        return (0, schematics_1.chain)([
            _ => host,
            (0, schematics_1.mergeWith)(templateSource)
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map