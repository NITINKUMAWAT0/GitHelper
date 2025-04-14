'use client'

import { useQueryClient } from '@tanstack/react-query'

type QueryKeys = string | readonly unknown[]

const useRefetch = () => {
  const queryClient = useQueryClient();
  
  return async (specificQueries?: QueryKeys | QueryKeys[]) => {
    if (specificQueries) {
      // Refetch specific queries if provided
      await queryClient.refetchQueries({
        queryKey: Array.isArray(specificQueries) ? specificQueries : [specificQueries],
      });
    } else {
      // Refetch all active queries if no specific queries provided
      await queryClient.refetchQueries({
        type: "active"
      });
    }
  }
}

export default useRefetch