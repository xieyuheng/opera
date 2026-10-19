import type { MarkdownNode } from "../markdownTypes.ts"
import { renderBlockquote } from "./nodes/blockquote.ts"
import { renderBreak } from "./nodes/break.ts"
import { renderCode } from "./nodes/code.ts"
import { renderDefinition } from "./nodes/definition.ts"
import { renderDelete } from "./nodes/delete.ts"
import { renderEmphasis } from "./nodes/emphasis.ts"
import { renderFootnoteDefinition } from "./nodes/footnote-definition.ts"
import { renderFootnoteReference } from "./nodes/footnote-reference.ts"
import { renderHeading } from "./nodes/heading.ts"
import { renderHtml } from "./nodes/html.ts"
import { renderImageReference } from "./nodes/image-reference.ts"
import { renderImage } from "./nodes/image.ts"
import { renderInlineCode } from "./nodes/inline-code.ts"
import { renderLinkReference } from "./nodes/link-reference.ts"
import { renderLink } from "./nodes/link.ts"
import { renderList, renderListItem } from "./nodes/list.ts"
import { renderParagraph } from "./nodes/paragraph.ts"
import { renderRoot } from "./nodes/root.ts"
import { renderStrong } from "./nodes/strong.ts"
import { renderTableCell } from "./nodes/table-cell.ts"
import { renderTableRow } from "./nodes/table-row.ts"
import { renderTable } from "./nodes/table.ts"
import { renderText } from "./nodes/text.ts"
import { renderThematicBreak } from "./nodes/thematic-break.ts"
import { renderYaml } from "./nodes/yaml.ts"
import type { MarkdownNodeRenderer } from "./types.ts"

type AnyMarkdownNodeRenderer = MarkdownNodeRenderer<any>

export const renderers: Partial<
  Record<MarkdownNode["type"], AnyMarkdownNodeRenderer>
> = {
  root: renderRoot,
  paragraph: renderParagraph,
  heading: renderHeading,
  text: renderText,
  emphasis: renderEmphasis,
  strong: renderStrong,
  delete: renderDelete,
  inlineCode: renderInlineCode,
  code: renderCode,
  blockquote: renderBlockquote,
  list: renderList,
  listItem: renderListItem,
  link: renderLink,
  linkReference: renderLinkReference,
  image: renderImage,
  imageReference: renderImageReference,
  definition: renderDefinition,
  footnoteDefinition: renderFootnoteDefinition,
  footnoteReference: renderFootnoteReference,
  table: renderTable,
  tableRow: renderTableRow,
  tableCell: renderTableCell,
  thematicBreak: renderThematicBreak,
  break: renderBreak,
  html: renderHtml,
  yaml: renderYaml,
}
