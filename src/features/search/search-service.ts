import { SearchFilters, SearchResultItem } from '../../shared/types/search.types';
import { WattpadApiClient } from '../../infrastructure/wattpad/wattpad-api';

export class SearchService {
  private static recentSearches: string[] = [];

  public static async search(filters: SearchFilters): Promise<SearchResultItem[]> {
    if (filters.query && !this.recentSearches.includes(filters.query)) {
      this.recentSearches.unshift(filters.query);
      if (this.recentSearches.length > 5) this.recentSearches.pop();
    }
    return WattpadApiClient.searchStories(filters);
  }

  public static getRecentSearches(): string[] {
    return this.recentSearches;
  }
}
