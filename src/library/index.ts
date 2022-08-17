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
import { validateName } from '../utilities/validation';

interface LibraryOptions {
    name: string;
    path: string;
    project: string;
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
        const dasherizedName = strings.dasherize(options.name);
        const libSrcPath = `libs/shared/src/lib/${dasherizedName}`;
        const parsedPath = parseName(libSrcPath, options.name);
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
                  passWithNoTests: true
                }
              }
            }
        };

        nxWorkspace.projects[libId] = {
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
