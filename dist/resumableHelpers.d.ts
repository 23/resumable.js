import { ExtendedFile } from "./types/types";
import 'ts-polyfill';
export default class ResumableHelpers {
    /**
     * Stop the propagation and default behavior of the given event `e`.
     */
    static stopEvent(e: Event): void;
    /**
     * Generate a unique identifier for the given file based on its size, filename and relative path.
     * @param {ExtendedFile} file The file for which the identifier should be generated
     * @returns {string} The unique identifier for the given file object
     */
    static generateUniqueIdentifier(file: ExtendedFile): string;
    /**
     * Flatten the given array and all contained subarrays.
     * Credit: {@link https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_flattendeep}
     */
    static flattenDeep(array: any[]): any[];
    /**
     * Filter the given array based on the predicate inside `callback`
     * and executes `errorCallback` for duplicate elements.
     */
    static uniqBy(array: any[], callback: Function, errorCallback: Function): any[];
    /**
     * Format the size given in Bytes in a human readable format.
     */
    static formatSize(size: number): string;
    /**
     * Get the target url for the specified request type and params
     */
    static getTarget(requestType: string, sendTarget: string, testTarget: string, params: object, parameterNamespace?: string): string;
}
