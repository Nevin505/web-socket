export function isUndefined<T>(object: T, key: keyof T, value: T[keyof T]) {
    return object[key] != undefined && value != undefined;
}