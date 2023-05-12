"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const parse_name_1 = require("../utilities/parse-name");
const project_1 = require("../utilities/project");
const validation_1 = require("../utilities/validation");
function default_1(options) {
    return (host) => {
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option (project) is required.');
        }
        const project = (0, project_1.getProject)(host, options.project);
        if (options.path === undefined) {
            options.path = (0, project_1.buildDefaultPath)(project);
        }
        const parsedPath = (0, parse_name_1.parseName)(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        (0, validation_1.validateName)(options.name);
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            options.skipTests ? (0, schematics_1.filter)(path => !path.endsWith('.spec.ts.template')) : (0, schematics_1.noop)(),
            (0, schematics_1.applyTemplates)(Object.assign(Object.assign({}, core_1.strings), options)),
            (0, schematics_1.move)(parsedPath.path),
        ]);
        return (0, schematics_1.chain)([
            (0, schematics_1.mergeWith)(templateSource)
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map