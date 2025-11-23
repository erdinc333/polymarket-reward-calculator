# Polymarket Reward Calculator

A modern, real-time tool to estimate liquidity rewards for [Polymarket](https://polymarket.com) prediction markets.

![Project Screenshot](https://via.placeholder.com/800x400?text=Polymarket+Reward+Calculator)

## Features

*   **Real-time Data:** Fetches live market data and order books directly from Polymarket APIs.
*   **Accurate Reward Estimation:** Calculates estimated daily rewards based on your investment amount and current market depth.
*   **Detailed Depth Analysis:**
    *   Shows depth for **+/- 1%**, **+/- 2%**, and **+/- 3%** spreads.
    *   Uses additive spread logic (e.g., +/- 1 cent) to correctly handle low-priced markets.
    *   **New:** Displays detailed breakdown of **Bids Depth** and **Asks Depth** for full transparency.
*   **Grouped Results:** Clean, card-based layout grouping results by market questions.
*   **Privacy Focused:** Runs entirely client-side (via local API proxies to handle CORS), no data is stored.

## Getting Started

### Prerequisites

*   Node.js 18+
*   npm, yarn, or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/erdinc333/polymarket-reward-calculator.git
    cd polymarket-reward-calculator
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

1.  Copy a Polymarket event URL (e.g., `https://polymarket.com/event/will-elon-musk-be-times-person-of-the-year-for-2025`).
2.  Paste it into the "Polymarket Event URL" field.
3.  Enter your intended investment amount (e.g., `1000`).
4.  Click **Calculate Rewards**.
5.  View the estimated daily rewards and depth breakdown for each outcome.

## How it Works

The calculator uses the Polymarket Gamma API to fetch market details and the CLOB (Central Limit Order Book) API to fetch live orders.

**Reward Formula:**
```
DailyReward * (UserInvestment / (CurrentDepth + UserInvestment))
```

*   **Current Depth:** The sum of all valid Bids and Asks within the specified spread range (e.g., +/- 1 cent from mid-price).
*   **User Investment:** The amount you plan to provide as liquidity.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
