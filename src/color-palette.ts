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
  createColor("Peace", "#a4b0be", BLACK),
  createColor("Grisaille", "#57606f"),
  createColor("Orange", "#ffa502"),
  createColor("Bruschetta", "#ff6348"),
  createColor("Watermelon", "#ff4757"),
  createColor("Bay Wharf", "#747d8c"),
  createColor("Prestige Blue", "#2f3542"),
  createColor("Lime Soap", "#7bed9f", BLACK),
  createColor("French Sky Blue", "#70a1ff"),
  createColor("Saturated Sky", "#5352ed"),
  createColor("City Lights", "#dfe4ea", BLACK),
  createColor("UFO Green", "#2ed573"),
  createColor("Clear chill", "#1e90ff"),
  createColor("Bright Greek", "#3742fa"),
  createColor("Anti-flash White", "#f1f2f6", BLACK),
  createColor("Twinkle Blue", "#ced6e0", BLACK)
]

export default colors
