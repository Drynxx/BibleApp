# Discover — Needs-First Library Redesign

## Direction
Turn Discover into a clearer library with three persistent tabs: **Plans**, **Books**, and **Verses**. The default Plans view starts from the user’s current need, while search remains available across the entire library.

Keep the established warm ivory, terracotta, sage, and muted-gold palette. Match the Progress page’s type system: **Newsreader** for editorial headings and Bible references, **DM Sans** for labels, search, navigation, and actions.

## Structure

### 1. Calm, compact header
- Keep **Discover** as the single page title with a short supporting line.
- Place universal search immediately below it.
- Search plans, book names, references, verse text, and topics from one field.
- Show grouped results in the order **Plans → Books → Verses**, using a distinct row style for each content type.

### 2. Persistent library tabs
- Add a restrained three-part control below search: **Plans**, **Books**, **Verses**.
- Keep the selected tab visually obvious without playful or oversized pills.
- Preserve the selected tab while users open and close previews.

### 3. Plans tab — choose by need
- Make this the default tab.
- Lead with a compact **What do you need today?** topic selector using Peace, Comfort, Guidance, and Growth.
- Show one image-led featured plan for the selected need.
- Follow it with compact plan rows showing title, topic, verse count, and a short description.
- Keep imagery editorial and abstract; reduce decorative competition around the actual plan information.

### 4. Books tab — faster Bible navigation
- Start with **Recently viewed** or commonly used books in a compact row.
- Separate the full directory into **Old Testament** and **New Testament**.
- Use an alphabetical, highly scannable list rather than small abbreviation tiles.
- Selecting a book opens its existing preview with curated references and an Add to Queue action.

### 5. Verses tab — reference-first browsing
- Make the reference the strongest element in every row.
- Show translation, a short two-line excerpt, and one restrained topic label.
- Add a direct icon action for queueing while the row itself opens the verse preview.
- Group the initial list into **Popular**, **For today**, or topic-based sections so it feels curated rather than like a database.

### 6. Smaller bottom queue tray
- Keep the fixed **Up next** tray above navigation, as selected.
- Reduce its height and shadow so it does not obscure card text or browsing content.
- Allow it to collapse to a compact reference-only bar and expand on tap.
- Keep **Add to Queue** / **Begin now** states and the existing Inscribe destination.

## Interaction and polish
- Keep all existing plan, book, verse preview sheets and queue behavior.
- Search temporarily replaces the tab content; clearing search returns users to their previous tab and topic.
- Use subtle divider, opacity, and image transitions; avoid playful bouncing or decorative motion.
- Retain keyboard focus, descriptive labels, sufficient touch targets, reduced-motion support, and readable contrast.

## Validation
- Check Plans, Books, and Verses tabs at mobile and wider preview sizes.
- Verify topic filtering, universal search, grouped results, previews, direct verse queueing, tray collapse/expand, and Begin now.
- Confirm the queue tray never covers meaningful content, no horizontal overflow occurs, and no preview errors remain.
