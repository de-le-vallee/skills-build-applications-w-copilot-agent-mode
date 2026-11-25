import { useEffect, useState } from 'react';
import { getJson } from './client.js';

type ApiState<T> =
  | { data: null; error: null; loading: true }
  | { data: T; error: null; loading: false }
  | { data: null; error: Error; loading: false };

export function useApi<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });
    getJson<T>(path).then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error('Unable to load data'),
            loading: false,
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
