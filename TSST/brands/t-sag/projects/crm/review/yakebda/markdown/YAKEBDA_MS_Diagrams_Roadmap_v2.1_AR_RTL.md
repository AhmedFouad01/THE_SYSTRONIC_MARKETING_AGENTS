<div dir="rtl" align="right">


# YAKEBDA MS — Diagrams Roadmap v2.1


## Program Sequence


```mermaid
flowchart LR
    BASE["Main baseline"] --> S11["Sources and Pricing"]
    S11 --> S12["Channel Menus"]
    S12 --> S13["Inventory and Recipes"]
    S13 --> S14["Delivery and Drivers"]
    S14 --> S15["Finance Control"]
    S15 --> S16["Accounting and COGS"]
    S16 --> S17["Online Connectors"]
    S17 --> S18["e-Receipt"]
```


## Target Architecture


```mermaid
flowchart LR
    UI["POS / Website / Platforms"] --> API["Order API"]
    API --> CTX["Source and Pricing Context"]
    CTX --> SRC["Order Source"]
    CTX --> MENU["Channel Menu"]
    CTX --> PRICE["Pricelist"]
    SRC --> QUOTE["Backend Quote"]
    MENU --> QUOTE
    PRICE --> QUOTE
    CATALOG["Master Catalog"] --> QUOTE
    QUOTE --> ORDERS["Orders and Snapshots"]
    ORDERS --> STOCK["Inventory"]
    ORDERS --> DELIVERY["Delivery"]
    ORDERS --> FINANCE["Finance Control"]
    STOCK --> FINANCE
    DELIVERY --> FINANCE
    FINANCE --> LEDGER["Accounting Bridge"]
```


## Required Diagrams


- YKMS-11: ERD، Quote Sequence، Repricing State.
- YKMS-12: Publishing، Mapping، Sync.
- YKMS-13: Inventory ERD، Movement، Deduction.
- YKMS-14: Dispatch، Driver State، Settlement.
- YKMS-15: Expense State، Reconciliation.
- YKMS-16: Posting، Reversal، Backfill.
- YKMS-17: Adapter، Webhook Retry.
- YKMS-18: Submission، Retry، Status.


</div>
