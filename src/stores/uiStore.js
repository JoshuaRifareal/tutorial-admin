import { create } from 'zustand';

const useUIStore = create((set) => ({
  isSearchOpen: false,
  searchQuery: '',
  activeTab: 'dashboard',
  isLoading: false,
  
  toggleSearch: () => set(state => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useUIStore;