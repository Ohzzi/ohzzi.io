const GRAY9 = "#191919"
const GRAY8 = "#2D2D2D"
const GRAY7 = "#404040"
const GRAY6 = "#868e96"
const GRAY5 = "#adb5bd"
const GRAY4 = "#ced4da"
const GRAY3 = "#dee2e6"
const GRAY2 = "#e9ecef"
const GRAY1 = "#f1f3f5"
const GRAY0 = "#f8f9fa"
const IVORY = "rgb(255, 255, 245)"
const IVORY_TRANSLUCENT = "rgba(255, 255, 245, 0.85)"
const SIGNATURE = "rgb(245, 143, 0)"
const SIGNATURE_LIGHT = "rgb(246, 187, 67)"
const SIGNATURE_TRANSLUCENT = "rgba(245, 143, 0, 0.75)"

export const light = {
  name: "light",
  colors: {
    bodyBackground: IVORY,
    text: GRAY9,
    secondaryText: GRAY7,
    tertiaryText: GRAY6,
    mutedText: GRAY5,
    hoveredLinkText: GRAY0,
    border: GRAY4,
    activatedBorder: GRAY6,
    background: GRAY1,
    icon: GRAY6,
    divider: GRAY2,
    headerBackground: IVORY_TRANSLUCENT,
    headerShadow: "rgba(0, 0, 0, 0.08)",
    inlineCodeBackground: GRAY2,
    inlineCodeBackgroundDarker: GRAY4,
    tagBackground: GRAY1,
    selectedTagBackground: GRAY7,
    hoveredTagBackground: SIGNATURE_LIGHT,
    hoveredSelectedTagBackground: SIGNATURE,
    hoveredTagText: GRAY7,
    hoveredSelectedTagText: GRAY0,
    nextPostButtonBackground: "rgba(0, 0, 0, 0.06)",
    hoveredNextPostButtonBackground: "rgba(0, 0, 0, 0.08)",
    seriesBackground: GRAY1,
    tagText: GRAY7,
    selectedTagText: GRAY0,
    spinner: GRAY7,
    scrollTrack: GRAY1,
    scrollHandle: GRAY4,
    blockQuoteBorder: GRAY4,
    blockQuoteBackground: GRAY1,
    textFieldBorder: GRAY4,
    textFieldActivatedBorder: GRAY5,
    tableBackground: GRAY1,
    signature: SIGNATURE,
    signatureLight: SIGNATURE_LIGHT,
    signatureTranslucent: SIGNATURE_TRANSLUCENT,
  },
}

export const dark = {
  name: "dark",
  colors: {
    bodyBackground: "rgba(40, 40, 40)",
    text: GRAY0,
    secondaryText: GRAY4,
    tertiaryText: GRAY5,
    mutedText: GRAY6,
    hoveredLinkText: GRAY9,
    border: GRAY5,
    activatedBorder: GRAY3,
    background: GRAY8,
    icon: GRAY5,
    headerIcon: SIGNATURE,
    divider: GRAY8,
    headerBackground: "rgba(40, 40, 40, 0.85)",
    headerShadow: "rgba(150, 150, 150, 0.08)",
    inlineCodeBackground: GRAY7,
    inlineCodeBackgroundDarker: GRAY9,
    tagBackground: GRAY8,
    selectedTagBackground: GRAY2,
    hoveredTagBackground: SIGNATURE_LIGHT,
    hoveredSelectedTagBackground: SIGNATURE,
    hoveredTagText: GRAY7,
    hoveredSelectedTagText: GRAY0,
    nextPostButtonBackground: "rgba(255, 255, 255, 0.05)",
    hoveredNextPostButtonBackground: "rgba(255, 255, 255, 0.08)",
    seriesBackground: GRAY8,
    tagText: GRAY2,
    selectedTagText: GRAY9,
    spinner: GRAY1,
    scrollTrack: GRAY8,
    scrollHandle: GRAY7,
    blockQuoteBorder: GRAY7,
    blockQuoteBackground: GRAY8,
    textFieldBorder: GRAY7,
    textFieldActivatedBorder: GRAY6,
    tableBackground: "#292e33",
    signature: SIGNATURE,
    signatureLight: SIGNATURE_LIGHT,
    signatureTranslucent: SIGNATURE_TRANSLUCENT,
  },
}
