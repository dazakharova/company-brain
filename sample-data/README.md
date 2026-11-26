# Ember Island IT Services | Company Brain sample data

All records, organisations, locations and contacts in this English-language pack are fictional.

## Start here

| Path | Contents |
| --- | --- |
| `data/customers.csv` and `data/laptops.csv` | Three customer organisations and twelve laptops |
| `data/support-tickets.json` | Nine tickets in one JSON array. An absent device or resolution is represented by `null`. |
| `data/agreement-index.csv` and `agreements/*.pdf` | Four support agreements and the metadata needed to link and open them |
| `guides/` | Eight Markdown files, including three versions of the loan device policy |
| `optional/` | The same loan inventory snapshot in CSV and Excel, plus a TXT shift handover |

Files use UTF-8 for plain text. CSV files use commas and a header row.
ISO timestamps include the applicable UTC offset. The workbook's inventory
timestamps remain ISO strings to preserve the offset.

## Relationships and usage

- Join customers, laptops, tickets and agreements by `customer_id`. A ticket may also have a `device_id` matching the laptop registry.
- Resolve each `pdf_path` from the project folder containing this README. Agreement end dates are inclusive.
- Markdown guide IDs identify pages across versions. The same ID with another version is a separate revision. Use published guides for ordinary support searches, and use archives for historical queries.
- Use one format of the inventory snapshot when importing. It records observations at 15:45 on 20 November 2026. Confirm availability before promising pickup.
- These are input files. Your team chooses where the application stores and maintains its records and guides.

## Demo scenarios

1. At 17:30 on Friday 20 November 2026, laptop `LT-1042` will not start. Find the customer, the agreement in force, previous incident `HD-218`, and the current loan and after-hours guides. What still needs to be confirmed?
2. Compare current loan eligibility for `CUST-001` and `CUST-002`. Open both agreements from the customer records.
3. Find the pickup location in force on 12 November 2026, then find the current one. Can a draft take effect without publication?
4. Open ticket `HD-210`, which has an associated customer and no laptop.
5. Read the inventory export and the shift handover for `HD-230`. Can a technician confirm a specific unit or a Friday evening pickup from this evidence?
