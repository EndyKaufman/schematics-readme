import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export default function (schema: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([]);
    };
}
