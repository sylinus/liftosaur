/* eslint-disable @typescript-eslint/ban-types */
export namespace ObjectUtils {
  export function keys<T extends {}>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
  }

  export function values<T extends {}>(obj: T): Array<T[keyof T]> {
    return ObjectUtils.keys(obj).map((key) => obj[key]);
  }

  export function entries<T extends {}>(obj: T): Array<[keyof T, T[keyof T]]> {
    return ObjectUtils.keys(obj).map((key) => [key, obj[key]]);
  }

  export function combinedKeys<T extends Record<string, unknown>, U extends Record<string, unknown>>(
    obj1: T,
    obj2: U
  ): Array<keyof T | keyof U> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Array.from(new Set(ObjectUtils.keys(obj1).concat(ObjectUtils.keys(obj2) as any)));
  }

  export function findMaxValue<T extends Record<string, number | undefined>>(obj: T): number {
    return ObjectUtils.keys(obj).reduce<number>((memo, key) => {
      if (obj[key] > memo) {
        memo = obj[key]! || 0;
      }
      return memo;
    }, 0);
  }
}
