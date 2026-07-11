'use client';
import { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PoolsPage() {
  const [name, setName] = useState('');
  const [contributionAmountZar, setContributionAmountZar] = useState(1000);
  const [rotationFrequency, setRotationFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: pools, mutate } = useSWR('/api/pools', fetcher);

  const handleCreatePool = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/pools', {
        name,
        contributionAmountZar,
        rotationFrequency,
      });
      setSuccess(`Pool created: ${response.data.poolName}`);
      mutate();
      setName('');
      setContributionAmountZar(1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create pool');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Ubuntu Pool</h1>
      <div className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Pool Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Contribution (ZAR)"
          value={contributionAmountZar}
          onChange={(e) => setContributionAmountZar(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
        <select
          value={rotationFrequency}
          onChange={(e) => setRotationFrequency(e.target.value as 'weekly' | 'monthly')}
          className="w-full p-2 border rounded"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button
          onClick={handleCreatePool}
          disabled={isLoading || !name}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isLoading ? 'Creating...' : 'Create Pool'}
        </button>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Pools</h2>
        {pools?.length === 0 ? (
          <p>No pools yet.</p>
        ) : (
          <div className="space-y-2">
            {pools?.map((pool: any) => (
              <div key={pool.id} className="p-3 border rounded">
                <div className="font-medium">{pool.poolName}</div>
                <div className="text-sm text-gray-600">
                  R{pool.contributionZar} | {pool.cycle} | {pool.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
