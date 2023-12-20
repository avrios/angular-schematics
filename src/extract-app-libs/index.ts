import { strings } from '@angular-devkit/core';
import {
    Rule,
    Tree,
    apply,
    applyTemplates,
    chain,
    move,
    url
} from '@angular-devkit/schematics';

import { validateName } from '../utilities/validation';
import { parseName } from '../utilities/parse-name';

interface LibraryOptions {
    project: string;
    prefix: string;
    skipStartConfig: boolean;
    tags?: string;
    namespace?: string;
    path?: string;
}

export default function (options: LibraryOptions): Rule {
    return (host: Tree) => {
        const projectJsonFile = '/project.json';
        const { prefix, project, skipStartConfig, tags: tagsString } = options;
        const dasherizedName = strings.dasherize(project);
        
        const parsedPath = parseName(`libs/${dasherizedName}`, project);
        
        validateName(parsedPath.name);

        const projectLibsRoot = parsedPath.path;
        const tags = tagsString ? tagsString.split(',').map(s => s.trim()) : [];

        const libraryNames = host.getDir(projectLibsRoot).subdirs;
        libraryNames.forEach(libraryName => {
            validateName(libraryName);
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
        
        const rules: any[] = [
            (_: any) => host
        ]

        if (!skipStartConfig) {
            rules.push(
                apply(url('./files'), [
                    applyTemplates({
                        ...strings,
                        ...options
                    }),
                    move(projectLibsRoot)
                ])
            );
        }

        
        return chain(rules);
    };
}
