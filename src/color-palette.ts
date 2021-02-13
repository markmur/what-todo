import { create } from "react-test-renderer"

export interface Color {
  name?: string
  backgroundColor: string
  foregroundColor
}

const BLACK = "#000000"
const WHITE = "#ffffff"

const createColor = (name, backgroundColor, foregroundColor = WHITE): Color => {
  return {
    name,
    backgroundColor,
    foregroundColor
  }
}

// Palette: https://flatuicolors.com/palette/cn
const colors: Color[] = [
  createColor("Golden Sand", "#eccc68", BLACK),
  createColor("Coral", "#ff7f50"),
  createColor("Wild Watermelon", "#ff6b81"),
  createColor("Orange", "#ffa502"),
  createColor("Bruschetta", "#ff6348"),
  createColor("Watermelon", "#ff4757"),
  createColor("Waterfall", "#38ada9"),
  createColor("Tomato Red", "#eb2f06"),
  createColor("UFO Green", "#45b975"),
  createColor("Saturated Sky", "#5352ed"),
  createColor("French Sky Blue", "#70a1ff"),
  createColor("Clear chill", "#1e90ff"),
  createColor("Bright Greek", "#3742fa"),
  createColor("Peace", "#a4b0be", BLACK),
  createColor("Blueberry Soda", "#7f8fa6"),
  createColor("Bay Wharf", "#747d8c"),
  createColor("Grisaille", "#57606f"),
  createColor("Prestige Blue", "#2f3542"),
  createColor("Dark Sapphire", "#0c2461"),
  createColor("Black", BLACK)
]

export default colors
