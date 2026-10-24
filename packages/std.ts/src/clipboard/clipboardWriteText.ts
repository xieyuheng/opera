export async function clipboardWriteText(text: string): Promise<boolean> {
  if (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall back to a temporary textarea below.
    }
  }

  return legacyClipboardWriteText(text)
}

function legacyClipboardWriteText(text: string): boolean {
  if (typeof document === "undefined") return false

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "-9999px"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}
