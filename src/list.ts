import { clampPage, add as plus } from './page/units'

export const view = (value: number) => format(plus(clampPage(value)))
