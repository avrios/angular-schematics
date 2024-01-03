import { strings } from '@angular-devkit/core';
import {
    Rule,
    SchematicsException,
    Tree,
    apply,
    applyTemplates,
    chain,
    mergeWith,
    move,
    url
} from '@angular-devkit/schematics';

import { validateName } from '../utilities/validation';
import { parseName } from '../utilities/parse-name';

interface LibraryOptions {
    name: string;
    prefix: string;
    tags?: string;
    namespace?: string;
    path?: string;
}

export default function (options: LibraryOptions): Rule {
    return (host: Tree) => {
        const projectJsonFile = '/project.json';
        const { prefix, name, tags: tagsString } = options;
        const dasherizedName = strings.dasherize(name);
        
        const projectLibsRoot = `libs/${dasherizedName}`;

        const parsedPath = parseName(projectLibsRoot, name);
        validateName(parsedPath.name);

        const appScope = `scope:${dasherizedName}`;
        const namespace = options.namespace ? options.namespace : parsedPath.name;
        const paths: Record<string, string[]>= {};
        
        const libraryNames = host.getDir(`${projectLibsRoot}/src/lib`).subdirs;
        libraryNames.forEach(libraryName => {
            validateName(libraryName);
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
            throw new SchematicsException(`Could not find ${dasherizedName}/tsConfig.json file.`);
        }

        if (!appEslintrc) {
            throw new SchematicsException(`Could not find ${dasherizedName}/.eslintrc.json file.`);
        }

        if (!eslintrc) {
            throw new SchematicsException(`Could not find /.eslintrc.json file.`);
        }

        // Add new libs paths to tsconfig.json
        const appTsConfigJson = JSON.parse(appTsConfig.toString());
        appTsConfigJson.compilerOptions.paths = {
            ...paths,
            ...appTsConfigJson.compilerOptions.paths
        };

        // Remove deactivated eslint rule @nrwl/nx/enforce-module-boundaries rule from app's .eslintrc.json
        const appEslintrcJson = JSON.parse(appEslintrc.toString());
        appEslintrcJson.overrides.forEach((elem: any) => {
            if (elem.rules && elem.rules['@nrwl/nx/enforce-module-boundaries'] === 'off') {
                delete elem.rules['@nrwl/nx/enforce-module-boundaries'];
            }
        });

        const eslintrcJson = JSON.parse(eslintrc.toString());
        const tags = tagsString ? tagsString.split(',').map(s => s.trim()) : [];
        eslintrcJson.overrides.forEach((elem: any) => {
            if (elem.rules && elem.rules['@nrwl/nx/enforce-module-boundaries']) {
                const found = elem.rules['@nrwl/nx/enforce-module-boundaries'][1].depConstraints.filter((constraint: any) => constraint.sourceTag === appScope);
                if (!found || !found.length) {
                    elem.rules['@nrwl/nx/enforce-module-boundaries'][1].depConstraints.push(
                        {
                            sourceTag: appScope,
                            onlyDependOnLibsWithTags: [...tags, appScope]
                        }
                    );
                }
            }
        });

        host.overwrite(appTsConfigPath, JSON.stringify(appTsConfigJson));
        host.overwrite(appEslintrcPath, JSON.stringify(appEslintrcJson));
        host.overwrite(eslintrcPath, JSON.stringify(eslintrcJson));

        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.namespace = namespace;

        const templateSource = apply(
            url('./files'), [
                applyTemplates({ ...strings, ...options }),
                move(projectLibsRoot),

        ]);

        return chain([
            _ => host,
            mergeWith(templateSource)
        ]);
    };
}
