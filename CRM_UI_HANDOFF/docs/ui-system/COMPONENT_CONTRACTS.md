# Component Contracts


## Button
Intents:
- primary
- secondary
- create
- danger


States:
- default
- hover
- pressed
- focus-visible
- disabled
- loading / aria-busy


Do not render a visually active control without an action.


## Input
Must support:
- normal
- focus-visible
- disabled
- error + aria-invalid + described error message


## Tabs
- semantic tablist/tab roles
- active tab uses roving tabindex
- Left/Right, Home/End keyboard handling
- arrow behavior respects RTL direction


## Menu / Popover
- initial focus enters menu
- Up/Down + Home/End
- Escape closes
- focus returns to trigger


## Dialog
- aria-modal
- initial focus
- Tab/Shift+Tab focus trap
- Escape closes
- focus returns to trigger
- destructive consequences are explicit


## Badge / Status
Use semantic status surfaces. Do not use brand Magenta/Navy to mean success/warning/error.


## AppShell
One shared shell only. Feature screens may not fork navigation or theme behavior.


## KPI Widget
Variants:
- neutral
- navy
- magenta


Use navy/magenta sparingly and intentionally.


## Icon
Single shared wrapper. Current geometry contract is 24x24 viewBox / 2px stroke. Directional icons mirror in RTL; status/object icons remain literal.


## State patterns
Loading, Empty, Error, Disabled and Permission states must use shared patterns rather than feature-local treatments.