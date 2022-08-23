import { StateTree, _DeepPartial } from '../types'

const isPlainObject = (value: any) => value?.constructor === Object

export function mergeObjects<T extends StateTree>(target: T, patchToApply?: _DeepPartial<T>): T {
  if (patchToApply && target) {
    for (const key in patchToApply) {
      // eslint-disable-next-line no-prototype-builtins
      if (!patchToApply.hasOwnProperty(key)) continue
      const subPatch = patchToApply[key]
      const targetValue = target[key]
      // eslint-disable-next-line no-prototype-builtins
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key)) {
        target[key] = mergeObjects(targetValue, subPatch)
      } else {
        // @ts-expect-error: subPatch is a valid value
        target[key] = subPatch
      }
    }
  }
  return target
}
