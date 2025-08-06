// Icon constants for the application
export const ICONS = {
  // Navigation icons
  dashboard: 'LayoutDashboard',
  users: 'Users',
  projects: 'FolderOpen',
  reports: 'BarChart3',
  settings: 'Settings',
  help: 'HelpCircle',
  
  // Action icons
  add: 'Plus',
  edit: 'Edit',
  delete: 'Trash2',
  save: 'Save',
  cancel: 'X',
  search: 'Search',
  filter: 'Filter',
  export: 'Download',
  import: 'Upload',
  
  // Status icons
  success: 'CheckCircle',
  error: 'XCircle',
  warning: 'AlertTriangle',
  info: 'Info',
  
  // UI icons
  menu: 'Menu',
  close: 'X',
  chevronDown: 'ChevronDown',
  chevronUp: 'ChevronUp',
  chevronLeft: 'ChevronLeft',
  chevronRight: 'ChevronRight',
  
  // Theme icons
  sun: 'Sun',
  moon: 'Moon',
  
  // Communication icons
  mail: 'Mail',
  phone: 'Phone',
  message: 'MessageSquare',
  
  // File icons
  file: 'File',
  folder: 'Folder',
  image: 'Image',
  document: 'FileText',
  
  // User icons
  user: 'User',
  userPlus: 'UserPlus',
  userMinus: 'UserMinus',
  
  // Other common icons
  calendar: 'Calendar',
  clock: 'Clock',
  location: 'MapPin',
  heart: 'Heart',
  star: 'Star',
  bell: 'Bell',
  eye: 'Eye',
  eyeOff: 'EyeOff',
  lock: 'Lock',
  unlock: 'Unlock',
  home: 'Home',
  logout: 'LogOut',
  login: 'LogIn'
} as const;

export type IconName = keyof typeof ICONS;