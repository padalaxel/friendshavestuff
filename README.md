# Gear Share (Local MVP)

A simple web app for sharing gear with friends.
This version runs locally using a simple file-based database for immediate testing.

## Getting Started

1.  **Install dependencies** (if not already done):
    ```bash
    npm install
    ```

2.  **Run the app**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    Visit [http://localhost:3000](http://localhost:3000)

## How to use

1.  **Login**: You will be presented with a login screen.
    *   Click **"Continue as Alice"** (The 'Owner' in the demo data)
    *   Or **"Continue as Bob"** (The 'Borrower' in the demo data)
    *   *No password is required.*

2.  **Browse**: See items available in the group.

3.  **Add Item**: Click "Add Item" to add your own gear (stored locally in `src/data/db.json`).

4.  **Borrow**:
    *   Log in as **Bob**.
    *   Click on **Alice's Tent**.
    *   Click **"Request to Borrow"**.
    *   Status changes to "pending".

5.  **Approve**:
    *   Log out and log in as **Alice**.
    *   Go to **Alice's Tent**.
    *   You will see the request. Click **"Approve"**.

6.  **Return**:
    *   Either user can mark the item as **"Returned"**.

## Data Reset
To reset the data, simply delete or edit `src/data/db.json` and restart the server (or just revert the file changes).
