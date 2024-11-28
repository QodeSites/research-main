// hooks/useIndexReturns.js
import { useState, useEffect } from 'react';
import { calculateReturns } from '../utils/calculateReturns';

export function useIndexReturns(indices) {
  const [returns, setReturns] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const results = {};

      // Iterate over each index
      for (const index of indices) {
        // Fetch the index data (assuming the API responds with a time series of values)
        const response = await fetch(`/api/indices/${index}`);
        const data = await response.json();

        // Calculate returns for different periods
        const indexReturns = {
          '10D': calculateReturns(data, '10D'),
          '1W': calculateReturns(data, '1W'),
          '1M': calculateReturns(data, '1M'),
          '3M': calculateReturns(data, '3M'),
          '6M': calculateReturns(data, '6M'),
          '9M': calculateReturns(data, '9M'),
          '1Y': calculateReturns(data, '1Y'),
        };

        // Store returns for each index
        results[index] = indexReturns;
      }

      setReturns(results);
      setLoading(false);
    };

    fetchData();
  }, [indices]);

  return { returns, loading };
}
