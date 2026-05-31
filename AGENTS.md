<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Client share gallery vs photographer dashboard

**Keep these UIs separate.** Do not replace the client link experience with the photographer folder-detail grid/lightbox.

| Surface | Routes | Primary code |
|--------|--------|----------------|
| **Client share gallery** | `/g/[token]`, `/[companySlug]/[gallerySlug]` | `components/client/client-gallery-app.tsx`, `components/client/share-gallery-bits.tsx` |
| **Photographer folder** | `/dashboard/folder/[id]` | `components/photographer/folder-detail-view.tsx` |

**Client gallery must keep:**

- Full-bleed cover hero (or branded fallback header), tabs (Originals / Selected / Finals)
- Layout picker (uniform, masonry, bento, split, horizontal scroll, collage, adaptive) with `GRID_STORAGE_PREFIX` persistence
- Heart/select controls on tiles, selection strip, submit flow
- In-app lightbox with zoom +/− and prev/next (defined in `client-gallery-app.tsx`, not shared with dashboard)

**Photographer folder** uses dense upload/final grids and its own preview — changes there should not be copied into the client gallery unless explicitly requested.
