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
    url,
    noop,
    filter
} from '@angular-devkit/schematics';

import { parseName } from '../utilities/parse-name';
import { buildDefaultPath, getProject } from '../utilities/project';
import { validateHtmlSelector, validateName } from '../utilities/validation';

interface ComponentOptions {
    name: string;
    path: string;
    prefix?: string;
    project: string;
    selector?: string;
    skipTests?: boolean;
}

function buildSelector(options: ComponentOptions, projectPrefix: string) {
    let selector = strings.dasherize(options.name);
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    } else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }

    return selector;
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
        options.selector = options.selector || buildSelector(options, project.prefix ?? '');

        validateName(options.name);
        validateHtmlSelector(options.selector);

        const templateSource = apply(url('./files'), [
            options.skipTests ? filter(path => !path.endsWith('.spec.ts.template')) : noop(),
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
