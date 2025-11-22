import { RewardCalculator } from "@/components/RewardCalculator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 md:p-24">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Polymarket Rewards
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Estimate your potential liquidity mining rewards by analyzing real-time order book depth and spread.
          </p>
        </div>

        <RewardCalculator />
      </div>
    </main>
  );
}
