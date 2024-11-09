# RegistryChain - APP UI

This is a demo front-end for creating and managing blockchain-native entities on RegistryChain, built with Next.js v13. It connects to Ethereum Sepolia Testnet (chain 11155111) and is a fork of the [Ethereum Naming Service (ENS) front-end](https://app.ens.domains/).

## Features

- Entity Formation: Begin by entering an entity name, selecting a jurisdiction, and choosing the entity type. Currently, only Partnership in the Public Registry jurisdiction is supported.
- Entity Management: Create entities with basic information, member details, and roles. The protocol automatically generates and displays your corporate bylaws/constitution for review before finalizing the entity formation.
- Transaction-Based Creation: Form your entity in a single Ethereum transaction. Upon success, you'll be directed to the entity profile page.
- Entity Profile: View detailed information about your entity, including its members, records, and constitution. Explore available services like Apps/Licenses (demo purposes).
- Actions Tab: Propose, confirm, and execute entity management actions, such as approving the constitution or making changes to the entity.

## Setup

To get started, clone this repository and install the dependencies:

`pnpm install`

For building the project:

`npm run build`

To run the local development server:

`npm run dev`

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
