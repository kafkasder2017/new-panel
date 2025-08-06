export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: NavItem[];
  roles?: string[];
  badge?: string | number;
  isCollapsible?: boolean;
  isExpanded?: boolean;
}

export interface NavigationState {
  expandedItems: string[];
  activeItem: string | null;
}

export interface NavigationContextType {
  state: NavigationState;
  toggleExpanded: (itemId: string) => void;
  setActiveItem: (itemId: string) => void;
}