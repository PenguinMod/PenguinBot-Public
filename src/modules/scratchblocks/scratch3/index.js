import SVG from "./draw.js"
import { LabelView } from "./blocks.js"
import style from "./style.js"
import { createCanvas } from "@napi-rs/canvas"

export function init(window) {
  SVG.init(window)

  LabelView.measuring = createCanvas(1, 1).getContext("2d")
}

export const makeStyle = style.makeStyle
export { newView } from "./blocks.js"
export const stylee = style;