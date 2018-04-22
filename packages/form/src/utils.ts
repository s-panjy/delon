import { Observable } from 'rxjs/Observable';
import { map, takeWhile } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { SFUISchema, SFUISchemaItem } from './schema/ui';
import { SFSchema, SFSchemaDefinition, SFSchemaEnum } from './schema';
import { deepCopy } from '../../abc/utils/utils';

export const FORMATMAPS = {
    'date-time': { widget: 'date' },
    date: { widget: 'date' },
    'full-date': { widget: 'date' },
    time: { widget: 'time' },
    'full-time': { widget: 'time' },
    week: { widget: 'date' },
    month: { widget: 'date' },
    uri: { widget: 'upload' },
    email: { widget: 'autocomplete', type: 'email' },
    '': { widget: 'string' }
};

export function isPresent(o: any) {
    return o !== null && o !== undefined;
}

export function isBlank(o: any) {
    return o == null;
}

export function di(...args) {
    // tslint:disable-next-line:no-console
    console.warn(...args);
}

export function isEmptyOrNull(type: string, value: any) {
    if (isBlank(value)) return true;
    return ('' + value).length === 0;
}

export function isObject(thing: any): boolean {
    return typeof thing === 'object' && thing !== null && !Array.isArray(thing);
}

export function mergeObjects(obj1: Object, obj2: Object, concatArrays = false) {
    return Object.keys(obj2).reduce((acc, key) => {
        const left = obj1[key],
            right = obj2[key];
        if (obj1.hasOwnProperty(key) && isObject(right)) {
            acc[key] = mergeObjects(left, right, concatArrays);
        } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
            acc[key] = left.concat(right);
        } else {
            acc[key] = right;
        }
        return acc;
    }, Object.assign({}, obj1));
}

/** 根据 `$ref` 查找 `definitions` */
function findSchemaDefinition($ref: string, definitions: SFSchemaDefinition = {}) {
    const match = /^#\/definitions\/(.*)$/.exec($ref);
    if (match && match[1]) {
        // parser JSON Pointer
        const parts = match[1].split('/');
        let current: any = definitions;
        for (let part of parts) {
            part = part.replace(/~1/g, '/').replace(/~0/g, '~');
            if (current.hasOwnProperty(part)) {
                current = current[part];
            } else {
                throw new Error(`Could not find a definition for ${$ref}.`);
            }
        }
        return current;
    }
    throw new Error(`Could not find a definition for ${$ref}.`);
}

/**
 * 取回Schema，并处理 `$ref` 的关系
 */
export function retrieveSchema(schema: SFSchema, definitions: SFSchemaDefinition = {}): SFSchema {
    if (schema.hasOwnProperty('$ref')) {
        const $refSchema = findSchemaDefinition(schema.$ref, definitions);
        // remove $ref property
        const { $ref, ...localSchema } = schema;
        return retrieveSchema(
            { ...$refSchema, ...localSchema },
            definitions
        );
    }

    return schema;
}

export function orderProperties(properties: string[], order: string[]) {
    if (!Array.isArray(order)) return properties;
    const arrayToHash = arr => arr.reduce((prev, curr) => {
        prev[curr] = true;
        return prev;
    }, {});
    const errorPropList = arr =>
        arr.length > 1
            ? `properties '${arr.join('\', \'')}'`
            : `property '${arr[0]}'`;

    const propertyHash = arrayToHash(properties);
    const orderHash = arrayToHash(order);
    const extraneous = order.filter(prop => prop !== '*' && !propertyHash[prop]);
    if (extraneous.length) {
        throw new Error(
            `ui schema order list contains extraneous ${errorPropList(extraneous)}`
        );
    }
    const rest = properties.filter(prop => !orderHash[prop]);
    const restIndex = order.indexOf('*');
    if (restIndex === -1) {
        if (rest.length) {
            throw new Error(
                `ui schema order list does not contain ${errorPropList(rest)}`
            );
        }
        return order;
    }
    if (restIndex !== order.lastIndexOf('*')) {
        throw new Error('ui schema order list contains more than one wildcard item');
    }
    const complete = [...order];
    complete.splice(restIndex, 1, ...rest);
    return complete;
}

export function getUiOptions(uiSchema: SFUISchema) {
    if (!uiSchema) return {};
    return Object.keys(uiSchema)
        .filter(key => !key.startsWith('$'))
        .reduce((options, key) => {
            return { ...options, [key]: uiSchema[key] };
        }, <SFUISchemaItem>{});
}

export function getEnum(list: any[], formData: any): SFSchemaEnum[] {
    if (isBlank(list) || !Array.isArray(list) || list.length === 0) return [];
    if (typeof list[0] !== 'object') {
        list = list.map((item: any) => {
            return <SFSchemaEnum>{ label: item, value: item };
        });
    }
    if (formData) {
        if (!Array.isArray(formData)) formData = [formData];
        list.forEach((item: SFSchemaEnum) => {
            if (~formData.indexOf(item.value)) item.checked = true;
        });
    }
    return list;
}

export function getCopyEnum(list: any[], formData: any) {
    return getEnum(deepCopy(list || []), formData);
}

export function getData(schema: SFSchema, ui: SFUISchemaItem, formData: any, asyncArgs?: any): Observable<SFSchemaEnum[]> {
    if (typeof ui.asyncData === 'function') {
        return ui.asyncData(asyncArgs).pipe(
            takeWhile(() => ui.__destroy !== true),
            map(list => getEnum(list, formData))
        );
    }
    return of(getCopyEnum(schema.enum, formData));
}
