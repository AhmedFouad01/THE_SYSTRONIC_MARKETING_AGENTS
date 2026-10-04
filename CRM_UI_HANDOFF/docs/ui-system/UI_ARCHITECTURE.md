# UI Architecture


## Principle
Theme and component behavior are global. Business screens compose the system; they do not create local design languages.


Primitive palette
→ Brand roles
→ Semantic roles
→ Component tokens
→ Interaction states
→ Feature composition


## Required production layers
### theme/
Owns theme provider, mode switching and theme contracts.


### tokens/
Owns primitive, brand and semantic tokens. Feature code must not directly own semantic colors.


### icons/
One shared icon wrapper. Current canonical stroke contract: 2px. Directional icons mirror in RTL; literal/status icons do not.


### primitives/
Button, Input, Badge, Panel, Tabs, Overlay/Dialog, feedback and state primitives.


### shell/
One AppShell for CRM navigation, workspace actions, account area and route content.


### data-grid/
Reusable data-heavy CRM workspace patterns: search, filter, saved views, sorting, column visibility, density, bulk actions, pagination and master-detail.


### i18n/
English/Arabic copy, direction, bidi handling and locale-aware formatting.


### features/
Feature modules compose the shared layers. Leads, Contacts and Deals must not fork theme/shell/component behavior.


## Prototype caveat
MagicPath normalized the prototype into large generated files. That is a tool limitation. Production implementation must split modules cleanly.