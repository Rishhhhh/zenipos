// Request Batching System for Supabase queries
// Batches multiple queries within 16ms window into single request
import { supabase } from '@/integrations/supabase/client';

interface BatchedQuery {
  table: string;
  select: string;
  filters?: Record<string, any>;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class QueryBatcher {
  private queue: BatchedQuery[] = [];
  private timeout: any = null;
  private readonly BATCH_WINDOW = 16; // ms (1 frame at 60fps)
  private processing = false;

  async batchQuery<T = any>(
    table: string,
    select: string = '*',
    filters?: Record<string, any>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ table, select, filters, resolve, reject });
      
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.processBatch(), this.BATCH_WINDOW);
      }
    });
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    this.timeout = null;
    const batch = [...this.queue];
    this.queue = [];

    console.log(`[Batcher] Processing ${batch.length} queries`);

    // Group by table
    const groupedByTable = batch.reduce((acc, query) => {
      if (!acc[query.table]) acc[query.table] = [];
      acc[query.table].push(query);
      return acc;
    }, {} as Record<string, BatchedQuery[]>);

    // Execute batched queries per table
    await Promise.all(
      Object.entries(groupedByTable).map(async ([table, queries]) => {
        try {
          // For queries with same select pattern, batch them
          const sameQueries = queries.filter(q => 
            q.select === queries[0].select && 
            JSON.stringify(q.filters) === JSON.stringify(queries[0].filters)
          );

          if (sameQueries.length === queries.length && queries.length > 1) {
            // All queries identical, execute once
            // @ts-ignore - Dynamic table/select not typed
            let finalQuery: any = supabase.from(table).select(queries[0].select);
            
            // Apply filters
            if (queries[0].filters) {
              Object.entries(queries[0].filters).forEach(([key, value]) => {
                finalQuery = finalQuery.eq(key, value);
              });
            }
            
            const { data, error } = await finalQuery;
            
            if (error) throw error;
            
            // Resolve all with same data
            sameQueries.forEach(q => q.resolve(data));
          } else {
            // Different queries, execute individually but in parallel
            await Promise.all(
              queries.map(async (q) => {
                try {
                  // @ts-ignore - Dynamic table/select not typed
                  let query: any = supabase.from(table).select(q.select);
                  
                  if (q.filters) {
                    Object.entries(q.filters).forEach(([key, value]) => {
                      query = query.eq(key, value);
                    });
                  }
                  
                  const { data, error } = await query;
                  
                  if (error) throw error;
                  q.resolve(data);
                } catch (err) {
                  q.reject(err);
                }
              })
            );
          }
        } catch (error) {
          console.error('[Batcher] Error processing batch:', error);
          queries.forEach(q => q.reject(error));
        }
      })
    );

    this.processing = false;

    // Process any new items that arrived during processing
    if (this.queue.length > 0) {
      this.timeout = setTimeout(() => this.processBatch(), this.BATCH_WINDOW);
    }
  }

  // Force immediate processing (for critical operations)
  async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    await this.processBatch();
  }
}

// Singleton instance
export const queryBatcher = new QueryBatcher();

// Convenience function for batched queries
export async function batchQuery<T = any>(
  table: string,
  select: string = '*',
  filters?: Record<string, any>
): Promise<T> {
  return queryBatcher.batchQuery<T>(table, select, filters);
}
