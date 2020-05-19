import { strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, applyTemplates, chain, mergeWith, move, url } from '@angular-devkit/schematics';

import { parseName } from '../utilities/parse-name';
import { buildDefaultPath, getProject } from '../utilities/project';
import { validateName } from '../utilities/validation';

interface ComponentOptions {
    name: string;
    path: string;
    project: string;
}

export default function (options: ComponentOptions): Rule {
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

        const templateSource = apply(url('./files'), [
            applyTemplates({
                ...strings,
                ...options,
            }),
            move(parsedPath.path),
        ]);

        return chain([
            mergeWith(templateSource)
        ]);
    };
}
