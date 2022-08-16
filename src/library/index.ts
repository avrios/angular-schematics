import { experimental, strings } from '@angular-devkit/core';
import {
    Rule,
    SchematicsException,
    Tree,
    apply,
    applyTemplates,
    chain,
    mergeWith,
    move,
    url,
    filter,
    noop
} from '@angular-devkit/schematics';

import { parseName } from '../utilities/parse-name';
import { buildDefaultPath, getProject } from '../utilities/project';
import { validateName } from '../utilities/validation';

interface LibraryOptions {
    name: string;
    path: string;
    project: string;
    prefix: string;
    skipTests?: boolean;
}

interface NxWorkspaceSchema {
    npmScope: string;
    affected: {
      [key:string]: any;
    },
    implicitDependencies: {
        [key:string]: any;
    },
    tasksRunnerOptions: {
        [key:string]: any;
    },
    projects: {
        [key:string]: any;
    }
}

export default function (options: LibraryOptions): Rule {
    const angularConfigFile = '/angular.json';
    const nxConfigFile = '/nx.json';

    return (host: Tree) => {
        if (!options.project) {
            throw new SchematicsException('Option (project) is required.');
        }

        const project = getProject(host, options.project);

        if (options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        const parsedPath = parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;

        validateName(options.name);

        const workspaceConfig = host.read(angularConfigFile);
        const nxWorkspaceConfig = host.read(nxConfigFile);

        if (!workspaceConfig) {
            throw new SchematicsException('Could not find Angular worspace configuration.');
        }

        if (!nxWorkspaceConfig) {
            throw new SchematicsException('Could not find NX worspace configuration.');
        }

        const workspaceContent = workspaceConfig.toString();
        const nxWorkspaceContent = nxWorkspaceConfig.toString();

        const workspace: experimental.workspace.WorkspaceSchema = JSON.parse(workspaceContent);
        const nxWorkspace: NxWorkspaceSchema = JSON.parse(nxWorkspaceContent);

        workspace.projects[options.name] = {
            root: options.path, // libs/shared,
            sourceRoot: options.path + '/src', // libs/shared/src,
            projectType: 'library',
            schematics: {},
            prefix: options.prefix || 'avr',
            architect: {
              lint: {
                builder: '@angular-devkit/build-angular:tslint',
                options: {
                  tsConfig: [
                    options.path + '/tsconfig.lib.json', // libs/shared/tsconfig.lib.json,
                    options.path + '/tsconfig.spec.json', //libs/shared/tsconfig.spec.json,
                    options.path + '.storybook/tsconfig.json' // libs/shared/.storybook/tsconfig.json
                  ],
                  exclude: [
                    '**/node_modules/**',
                    '!' + options.path + '/**/*'// !libs/shared/**/*
                  ]
                }
              },
              test: {
                builder: '@nrwl/jest:jest',
                options: {
                  jestConfig: options.path + '/jest.config.js', // libs/shared/jest.config.js,
                  passWithNoTests: true
                }
              }
            }
        };

        nxWorkspace.projects[options.name] = {
            tags: []
        }

        host.overwrite(angularConfigFile, JSON.stringify(workspace));
        host.overwrite(nxConfigFile, JSON.stringify(nxWorkspace));

        const templateSource = apply(url('./files'), [
            options.skipTests ? filter(path => !path.endsWith('.spec.ts.template')) : noop(),
            applyTemplates({
                ...strings,
                ...options,
            }),
            move(parsedPath.path),
        ]);

        return chain([
            _ => host,
            mergeWith(templateSource)
        ]);
    };
}
