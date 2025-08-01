// Role-based access control utilities

export const ROLES = {
  CHAIRMAN: 'Chairman',
  PMC: 'PMC',
  MESS_SECRETARY: 'Mess Secretary',
  MESS_HAWALDAR: 'Mess Hawaldar'
};

// Get current user role from sessionStorage
export const getCurrentUserRole = () => {
  return sessionStorage.getItem('userRole');
};

// Check if user has a specific role
export const hasRole = (role) => {
  const currentRole = getCurrentUserRole();
  return currentRole === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const currentRole = getCurrentUserRole();
  return roles.includes(currentRole);
};

// Role-based permissions
export const ROLE_PERMISSIONS = {
  [ROLES.CHAIRMAN]: {
    canBookDirectly: true,
    canApproveRequests: true,
    canManageRooms: true,
    canManageInventory: true,
    canViewAnalytics: true,
    canViewAllRooms: true,
    restrictedRooms: [], // No restrictions
    canRequestRooms: false, // Chairman doesn't need to request
  },
  [ROLES.PMC]: {
    canBookDirectly: true,
    canApproveRequests: true, // PMC can approve requests (but only non-premium ones due to filtering)
    canManageRooms: false,
    canManageInventory: false,
    canViewAnalytics: true,
    canViewAllRooms: true,
    restrictedRooms: [1, 2, 'premium'], // Cannot book first 2 rooms and premium rooms directly
    canRequestRooms: true,
  },
  [ROLES.MESS_SECRETARY]: {
    canBookDirectly: false,
    canApproveRequests: false,
    canManageRooms: true,
    canManageInventory: true,
    canViewAnalytics: true,
    canViewAllRooms: true,
    // restrictedRooms: ['premium'], // Cannot book premium rooms
    canRequestRooms: true,
  },
  [ROLES.MESS_HAWALDAR]: {
    canBookDirectly: false,
    canApproveRequests: false,
    canManageRooms: true,
    canManageInventory: true,
    canViewAnalytics: true,
    canViewAllRooms: true,
    restrictedRooms: ['premium'], // Cannot book premium rooms
    canRequestRooms: true,
  }
};

// Get permissions for current user
export const getCurrentUserPermissions = () => {
  const role = getCurrentUserRole();
  return ROLE_PERMISSIONS[role] || {};
};

// Check if user can book a specific room
export const canBookRoom = (roomId, roomType) => {
  const permissions = getCurrentUserPermissions();
  const restrictedRooms = permissions.restrictedRooms || [];
  
  // Check if room ID is restricted
  if (restrictedRooms.includes(roomId)) {
    return false;
  }
  
  // Check if room type is restricted
  if (restrictedRooms.includes(roomType)) {
    return false;
  }
  
  return permissions.canBookDirectly;
};

// Check if user can book or request a specific room
export const canBookOrRequestRoom = (roomId, roomType) => {
  const permissions = getCurrentUserPermissions();
  const restrictedRooms = permissions.restrictedRooms || [];
  
  // Check if room ID is restricted
  if (restrictedRooms.includes(roomId)) {
    return false;
  }
  
  // Check if room type is restricted
  if (restrictedRooms.includes(roomType)) {
    return false;
  }
  
  // User can book directly OR request rooms
  return permissions.canBookDirectly || permissions.canRequestRooms;
};

// Check if user can see a room in booking modal (for PMC, show premium rooms but they require request)
export const canSeeRoomInBooking = (roomId, roomType) => {
  const permissions = getCurrentUserPermissions();
  const role = getCurrentUserRole();
  
  // For PMC, show all rooms except the first 2
  if (role === ROLES.PMC) {
    return !permissions.restrictedRooms.includes(roomId);
  }
  
  // For other roles, use the same logic as canBookOrRequestRoom
  return canBookOrRequestRoom(roomId, roomType);
};

// Check if user can approve requests
export const canApproveRequests = () => {
  const permissions = getCurrentUserPermissions();
  return permissions.canApproveRequests;
};

// Check if user can manage rooms (add, edit, delete)
export const canManageRooms = () => {
  const permissions = getCurrentUserPermissions();
  return permissions.canManageRooms;
};

// Check if user can manage inventory
export const canManageInventory = () => {
  const permissions = getCurrentUserPermissions();
  return permissions.canManageInventory;
};

// Check if user can view analytics
export const canViewAnalytics = () => {
  const permissions = getCurrentUserPermissions();
  return permissions.canViewAnalytics;
};

// Check if user can request rooms
export const canRequestRooms = () => {
  const permissions = getCurrentUserPermissions();
  return permissions.canRequestRooms;
};

// Check if user can view booking requests
export const canViewBookingRequests = () => {
  const permissions = getCurrentUserPermissions();
  // Chairman can approve requests, PMC can view requests but not approve
  return permissions.canApproveRequests || (permissions.canRequestRooms && getCurrentUserRole() === ROLES.PMC);
};

// Get menu items based on user role
export const getMenuItems = () => {
  const role = getCurrentUserRole();
  const permissions = getCurrentUserPermissions();
  
  const allMenuItems = [
    { text: 'Dashboard', icon: '📊', id: 'dashboard' },
    { text: 'Rooms', icon: '🚪', id: 'rooms' },
    { text: 'BookingStatus', icon: '📅', id: 'bookingstatus' },
    { text: 'BookingRequests', icon: '📝', id: 'bookingrequests' },
    { text: 'Inventory', icon: '📋', id: 'inventory' },
    { text: 'Analytics', icon: '📈', id: 'analytics' },
  ];
  
  // Filter menu items based on permissions
  return allMenuItems.filter(item => {
    switch (item.id) {
      case 'inventory':
        return permissions.canManageInventory;
      case 'analytics':
        return permissions.canViewAnalytics;
      case 'bookingrequests':
        return permissions.canApproveRequests || (permissions.canRequestRooms && role === ROLES.PMC);
      default:
        return true;
    }
  });
}; 