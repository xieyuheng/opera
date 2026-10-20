# @windbell/common-fonts.css

Common font faces and font-family tokens for Windbell applications.

Import the package CSS:

```css
@import "@windbell/common-fonts.css";
```

The package does not define a default font. The consuming application chooses a font by setting `data-font` on the root element:

```html
<html data-font="unifont"></html>
```

Supported bundled values:

- `unifont`
- `source-han-serif`
- `source-han-sans`

The consuming application can use the system/default font by leaving `data-font` unset.

If `data-font` is absent or none of the supported values match, the package does not define the font custom properties.

The package provides the following CSS custom properties when a variant is selected:

- `--font-body`
- `--font-code`
