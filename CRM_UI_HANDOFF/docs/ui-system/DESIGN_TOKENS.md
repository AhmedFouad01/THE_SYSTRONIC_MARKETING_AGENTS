# Design Tokens


## Brand constants
- Navy: #181D36
- Magenta/Red: #FF003C
- Dark Magenta: #E50036
- Create Teal: #00BFA6


Brand emphasis does not replace semantic status colors.


## Key Light semantic values
- canvas: #F3F5F7
- surface: #FFFFFF
- surface2: #F7F9FB
- surface3: #EEF2F6
- border: #DDE3EA
- borderStrong: #C9D1DB
- text: #181D36
- text2: #475467
- text3: #667085
- selected: #D8F4FA
- focus: #009FD4
- primary: #181D36
- primaryFg: #FFFFFF
- create: #00BFA6
- createFg: #042F2A
- successBg: #DDF7E8
- successFg: #087443
- warningBg: #FFF6E5
- warningFg: #915A00
- dangerBg: #FFF0F4
- dangerFg: #B0002C


## Key Dark semantic values
- canvas: #090D14
- surface: #111722
- surface2: #171E29
- surface3: #202936
- border: #2B3442
- borderStrong: #3B4656
- text: #F7F9FC
- text2: #C3CAD4
- text3: #98A2B3
- selected: #0B3A47
- focus: #7DE2FF
- primary: #00BEF6
- primaryFg: #0D1020
- create: #00BFA6
- createFg: #042F2A
- successBg: #0D2D20
- successFg: #7CE5AA
- warningBg: #35290C
- warningFg: #FFD16A
- dangerBg: #3A121C
- dangerFg: #FF9CB0


## KPI emphasis
At most one or two high-emphasis KPI cards per section:
- Navy: high-priority operational/business metric.
- Magenta: critical business emphasis/outcome.
- Supporting metrics: neutral surface.


Do not color every widget.


## Contrast
Create foreground was intentionally changed from white to #042F2A on #00BFA6.
Status colors must retain readable foreground/background contrast.


## Rule
Components consume semantic tokens. Do not hard-code these values into feature screens unless the value is an approved brand primitive used through a shared component contract.