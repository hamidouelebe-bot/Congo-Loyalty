# DRC Loyalty — Database Schema Documentation

**Version:** 1.0
**Database Engine:** Google Firebase Firestore (NoSQL)
**Last Updated:** May 2024

---

## 1. Overview & Architecture

The application uses a **Document-Oriented NoSQL** structure.
- **Collections** are analogous to SQL Tables.
- **Documents** are analogous to SQL Rows (but can contain nested objects).
- **Sub-collections** are used for tightly coupled data (though this schema primarily uses root-level collections for scalability).

### Core Collections
1.  `users` — Shopper profiles and authentication data.
2.  `receipts` — Transaction history and OCR data.
3.  `supermarkets` — Partner stores and metadata.
4.  `campaigns` — Marketing rules and logic.
5.  `notifications` — User alerts.
6.  `content` — Singleton configuration for static app content.

---

## 2. Collections Detail

### A. Users Collection (`users`)
**Purpose:** Stores shopper identity, loyalty balance, and demographics.
**Document ID:** Auto-generated UUID or Auth UID.

| Field Name | Data Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `firstName` | String | Required | User's first name. |
| `lastName` | String | Required | User's last name. |
| `email` | String | Required | Contact email (verified via OTP). |
| `phoneNumber` | String | **Unique** | Primary login identifier (e.g., `811234567`). Indexed for fast lookup. |
| `pin` | String | Required | 4-digit security PIN for authentication. |
| `status` | String | Default: `active` | Enum: `active`, `banned`, `suspended`. |
| `pointsBalance` | Number | Default: 0 | Current spendable points. |
| `pointsExpiring` | Number | Default: 0 | Points scheduled to expire in the next cycle. |
| `pointsExpiresAt` | String (ISO Date) | Nullable | Date of next expiration (YYYY-MM-DD). |
| `totalSpent` | Number | Default: 0 | Lifetime spend (CDF). Used for VIP calculation. |
| `joinedDate` | String (ISO Date) | Required | Account creation date. |
| `gender` | String | Optional | Enum: `Male`, `Female`, `Other`. |
| `birthdate` | String (ISO Date) | Optional | User DOB for age calculation. |

---

### B. Receipts Collection (`receipts`)
**Purpose:** Stores scanned receipt images, AI-extracted data, and verification status.
**Document ID:** Auto-generated UUID.

| Field Name | Data Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `userId` | String (Ref) | Required | Foreign Key linking to `users` collection. |
| `supermarketName` | String | Required | Name of store extracted from OCR. |
| `amount` | Number | Required | Total transaction value (CDF). |
| `date` | String (ISO Date) | Required | Transaction date visible on receipt. |
| `status` | String | Default: `pending` | Enum: `pending` (needs review), `verified`, `rejected`. |
| `confidenceScore` | Number | Required | AI confidence level (0.0 - 1.0). |
| `imageUrl` | String (URL) | Required | Link to Firebase Storage (`gs://...`). |
| `items` | Array<Object> | Optional | List of line items extracted. |

**`items` Object Structure:**
```json
{
  "name": "Kelloggs Corn Flakes",
  "quantity": 2,
  "unitPrice": 12000,
  "total": 24000,
  "category": "Cereals"
}
```

---

### C. Supermarkets Collection (`supermarkets`)
**Purpose:** Stores partner details, locations, and operational metadata.
**Document ID:** Auto-generated UUID.

| Field Name | Data Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required | Business name. |
| `address` | String | Required | Physical address string. |
| `active` | Boolean | Default: `true` | Visibility toggle. |
| `logoUrl` | String (URL) | Optional | Branding image. |
| `businessHours` | String | Optional | Text description (e.g., "08:00 - 22:00"). |
| `latitude` | Number | Optional | GPS Latitude. |
| `longitude` | Number | Optional | GPS Longitude. |
| `avgBasket` | Number | Calculated | Analytics metric (cached). |

---

### D. Campaigns Collection (`campaigns`)
**Purpose:** Defines marketing rules, durations, and targeted offers.
**Document ID:** Auto-generated UUID.

| Field Name | Data Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required | Internal campaign name. |
| `brand` | String | Required | Brand owner (e.g., "Heineken"). |
| `status` | String | Required | Enum: `draft`, `active`, `ended`. |
| `startDate` | String (ISO Date) | Required | Activation date. |
| `endDate` | String (ISO Date) | Required | Expiration date. |
| `mechanic` | String | Required | The rule text (e.g., "Buy 2 get 500pts"). |
| `minSpend` | Number | Optional | Minimum receipt amount to trigger. |
| `maxRedemptions` | Number | Optional | Budget safety cap. |
| `conversions` | Number | Default: 0 | Count of successful claims. |
| `targetAudience` | String | Default: `all` | Enum: `all`, `vip`, `new`, `churn_risk`. |
| `supermarketIds` | Array<String> | Required | List of participating Store IDs. |
| `rewardType` | String | Required | Enum: `points`, `voucher`, `giveaway`. |
| `rewardValue` | String/Number | Required | The value (e.g., 500 or "T-Shirt"). |

---

### E. Notifications Collection (`notifications`)
**Purpose:** System alerts for users (Push Notification feed).
**Document ID:** Auto-generated UUID.

| Field Name | Data Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `userId` | String (Ref) | Required | Target user ID. |
| `title` | String | Required | Alert header. |
| `message` | String | Required | Alert body text. |
| `date` | String (ISO Date) | Required | Sent date. |
| `read` | Boolean | Default: `false` | Read status. |
| `type` | String | Required | Enum: `expiration`, `system`, `reward`. |

---

### F. Content Collection (`content`)
**Purpose:** Dynamic configuration for app text (Terms, Privacy, Landing Page).
**Document ID:** `main` (Singleton).

**Structure:**
```json
{
  "landing": {
    "appName": "DRC Loyalty",
    "heroTitle1": "Le Futur du ",
    "heroTitle2": "Retail",
    "heroDesc": "...",
    "footerCopy": "..."
  },
  "help": { "title": "Aide", "content": "..." },
  "privacy": { "title": "Confidentialité", "content": "..." },
  "terms": { "title": "Conditions", "content": "..." }
}
```

---

## 3. Indexes & Performance

### Required Composite Indexes
To support the application's queries, the following indexes are configured in `firestore.indexes.json`:

1.  **Shopper Login Lookup:**
    - Collection: `users`
    - Fields: `phoneNumber` (Ascending) + `pin` (Ascending)

2.  **Campaign Targeting:**
    - Collection: `campaigns`
    - Fields: `status` (Ascending) + `supermarketIds` (Array Contains)

3.  **Receipts by User:**
    - Collection: `receipts`
    - Fields: `userId` (Ascending) + `date` (Descending)

---

## 4. Security Rules (RBAC) summary

- **Public Read:** Campaigns, Supermarkets, Content.
- **Owner Only (Read/Write):** User Profiles (`users/{uid}`), Receipts (`receipts/{id}` where userId matches auth), Notifications.
- **Admin Only (Full Access):** All collections, plus specific write access to Campaigns and Supermarkets.
