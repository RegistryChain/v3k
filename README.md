# RegistryChain Front End Developer Documentation

## Overview

### Project Context

The front end of the RegistryChain platform is built with **React** and **Next.js**, modeled after the Ethereum Name Service (ENS) domain app ([live ENS site](https://app.ens.domains/)). We have redesigned this to demo the core workflows of **Entity Formation**, **Entity Amendments**, and **Entity Management** on the RegistryChain platform.

This app allows users to:

- **Create** new entities with governance structures.
- **Amend** existing entities, including constitutions and metadata.
- **View** entity details, including records, constitution, and metadata.

The front end relies on **ERC-3668** and **ERC-5559** standards for handling off-chain data storage and on-chain interactions, communicating between the blockchain, backend gateway, and client.

---

## Getting Started

### Installation and Setup

1. **Clone** the repository from the version control system.
2. **Install dependencies** by running:
   ```bash
   pnpm install
   ```
3. **Start the local development server** with:
   ```bash
   npm run dev
   ```
4. Ensure the development environment is set up with:
   - A wallet like **Metamask** for blockchain interactions.
   - Access to the **Sepolia Testnet** for testing blockchain transactions.
   - **Sepolia ETH** in your wallet for testing transactions (message **Michael** if needed).

---

## Main Workflows and Codebase Structure

### Workflows and Associated Files

#### Entity Formation

**File**: `entity.tsx`

**Purpose**: Handles the creation of new entities.

**Workflow**:

1. Users input entity details such as roles, partners, and constitution data.
2. Uses state to render a Single Page Application (SPA) for managing components containing different input types collected for the entity.
3. Data is encoded, signed by the user using **ERC-3668** standards, and sent to the backend.
4. The response is processed by functions in `useExecuteWriteToResolver.ts`, which creates a transaction to update the blockchain.

#### Entity Amendments

**File**: `entityAmend.tsx`

**Purpose**: Enables updates to existing entities.

**Workflow**:

1. Fetches current entity data using `getRecordData` from `useExecuteWriteToResolver.ts`.
2. Populates input fields with the fetched data.
3. Tracks user changes and validates them against existing data.
4. Sends update requests to the Gateway backend and creates on-chain transactions, similar to `entity.tsx`, but distinguished by the methods called.
5. Update methods are separated by type:
   - Some updates are **on-chain only**.
   - Other amendments are made to the **Gateway resolver**.
6. The `entityAmend` component submits a **proposal** that must collect signatures in the `Actions` section of the profile before being realized.
7. Access is restricted to **authorized members** with specific roles (e.g., `manager` or `signer`).

#### Entity Management

**File**: `profile.tsx` (and its children, which contain most logic for tabs)

**Purpose**: Displays detailed information about entities and provides tools for managing them.

**Workflow**:

1. Fetches and renders entity records, including metadata and constitution data.
2. Highlights inconsistencies between fetched metadata and jurisdictional sources using `contradictoryFields`.
3. Provides the following tabs:
   - **Constitution**: Displays governance rules in plain-English format.
   - **Actions**: Lists current proposals, transactions needing confirmations, and execution options. This logic is managed in `ActionsTab.tsx`, where users control and manage their entities.
   - **Apps and Licenses**: Demonstrate integration points for third-party services or regulatory compliance data.

---

## Important File: `useExecuteWriteToResolver.ts`

This hook manages interactions between the front end, backend, and blockchain.

### Key Features

#### Data Handling

- Encodes user inputs for submission to the backend and blockchain.
- Decodes blockchain data for display on the front end.

#### Signature Management

- Generates and validates user signatures for secure data handling.

#### Backend Integration

- Provides functions for retrieving and submitting entity data.
- Handles transaction statuses and backend API calls.

### Key Functions

- **`getRecordData`**: Fetches JSON-formatted entity records for display.
- **`executeWriteToResolver`**: Handles special contract reversions for initiating **ERC-3668** flow. Encodes and sends data to the backend and blockchain.
- **`handleDBStorage`**: Makes signatures over data to be passed to the Gateway.

## Usage

### Start the Entity Formation Process:

- From the landing page, enter a name for your entity.
- Select the jurisdiction and entity type. The demo currently only supports the Partnership type in the Public Registry jurisdiction. This jurisdiction is open and permissionless, intended for testing the formation of blockchain-native entities.

### Fill in Entity Information:

- Once you've chosen your entity type and jurisdiction, you will be directed to the entity formation flow.
- Input the basic information for your entity (e.g., name, description, etc.).
- Enter member details, including their roles and responsibilities within the entity (e.g., founder, partner).
- Define the shares/roles distribution among the members. This establishes the governance structure of your entity.

### Review Corporate Bylaws/Constitution:

- The protocol will automatically generate a constitution based on the information you provided.
- Review the constitution to ensure it matches your expectations, as this document will govern the entity.

### Submit the Formation Transaction:

- After reviewing the constitution, you will be prompted to confirm and form the entity in a single transaction on Ethereum Sepolia Testnet.
- Once confirmed, a transaction will be initiated. If successful, your entity will be officially created on the blockchain, and you'll be redirected to the entity profile page.

### View Your Entity Profile:

- The entity profile page displays all records related to your entity, including member information, constitution, and entity actions.
- You can navigate through various tabs to view and manage the following:
  - Constitution: The legal document outlining the governance and rules of your entity.
  - Entity Actions: Propose, confirm, and execute management actions for your entity (e.g., approving the constitution, adding/removing members).
  - Apps/Licenses: Currently a demo tab to display available services that can be used by your entity (for future expansion).

### Entity Management through the Actions Tab:

- In the Actions tab, you can manage the entity’s operations by initiating proposals, confirming actions, and executing them.
- For example, to approve the constitution, all founding members must sign a declaration in the Actions tab, which triggers the approval process.
- Any changes to the entity's structure or rules (e.g., adding new members or modifying roles) can also be proposed and managed here.
