const urlAttributes = ["action", "href", "poster", "src"] as const
const cssUrlPattern = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^)'"]*))\s*\)/giu

export function renderMuseumHtml(source: string, documentUrl: string): string {
  const template = document.createElement("template")
  template.innerHTML = source

  for (const element of template.content.querySelectorAll("*")) {
    for (const attribute of urlAttributes) {
      const value = element.getAttribute(attribute)
      if (value === null) continue
      element.setAttribute(attribute, resolveRelativeUrl(value, documentUrl))
    }

    const xlinkHref = element.getAttribute("xlink:href")
    if (xlinkHref !== null) {
      element.setAttribute(
        "xlink:href",
        resolveRelativeUrl(xlinkHref, documentUrl),
      )
    }

    const style = element.getAttribute("style")
    if (style !== null) {
      element.setAttribute("style", rewriteCssUrls(style, documentUrl))
    }
  }

  for (const style of template.content.querySelectorAll("style")) {
    style.textContent = rewriteCssUrls(style.textContent ?? "", documentUrl)
  }

  return template.innerHTML
}

function resolveRelativeUrl(value: string, documentUrl: string): string {
  const url = value.trim()
  if (
    url === "" ||
    url.startsWith("#") ||
    url.startsWith("/") ||
    /^[a-z][a-z\d+.-]*:/iu.test(url)
  ) {
    return value
  }

  try {
    return new URL(url, documentUrl).href
  } catch {
    return value
  }
}

function rewriteCssUrls(css: string, documentUrl: string): string {
  return css.replace(
    cssUrlPattern,
    (_match, singleQuote: string, doubleQuote: string, bare: string) => {
      const value = singleQuote ?? doubleQuote ?? bare
      const resolved = resolveRelativeUrl(value, documentUrl)
      const quote =
        singleQuote === undefined ? (doubleQuote === undefined ? "" : '"') : "'"
      return `url(${quote}${resolved}${quote})`
    },
  )
}
