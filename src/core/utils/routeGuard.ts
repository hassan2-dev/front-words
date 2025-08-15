import { USER_ROLES, ROUTES, STORAGE_KEYS } from "../constants/app";

// Route access configuration
export const ROUTE_ACCESS = {
    // Admin-only routes
    ADMIN_ROUTES: [
        ROUTES.ADMIN_DASHBOARD,
        ROUTES.ADMIN_OVERVIEW,
        ROUTES.ADMIN_USERS,
        ROUTES.ADMIN_CONTENT,
        ROUTES.ADMIN_ACHIEVEMENTS,
        '/admin/*',
    ],

    // Trainer-only routes
    TRAINER_ROUTES: [
        ROUTES.TRAINER_DASHBOARD,
        ROUTES.TRAINER_STUDENTS,
        ROUTES.TRAINER_CONTENT,
        '/trainer/*',
    ],

    // User routes (accessible by all authenticated users)
    USER_ROUTES: [
        ROUTES.DASHBOARD,
        ROUTES.DAILY_WORDS,
        ROUTES.CHAT_WITH_AI,
        ROUTES.STORIES,
        ROUTES.NOTIFICATIONS,
        ROUTES.PROFILE,
        '/achievements',
        '/story-reader',
        '/story-exam',
        '/stories/daily',
        '/stories/:storyId',
        '/home',
    ],
} as const;

// Strict user validation function
export const validateUser = (user: any): boolean => {
    if (!user || typeof user !== 'object') {
        return false;
    }

    // Check required fields
    if (!user.id || !user.role) {
        return false;
    }

    // Validate role
    const validRoles = Object.values(USER_ROLES);
    if (!validRoles.includes(user.role)) {
        return false;
    }

    return true;
};

// Strict authentication validation function
export const validateAuthentication = (user: any, isAuthenticated: boolean): boolean => {
    if (!isAuthenticated || !user) {    
        return false;
    }

    // Handle nested user structure (user.user)
    const actualUser = user.user || user;

    // Validate user structure
    if (!validateUser(actualUser)) {
        return false;
    }

    // Check if token exists
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
        return false;
    }

    return true;
};

// Strict role validation function
export const validateUserRole = (user: any, allowedRoles: string[]): boolean => {
    // Handle nested user structure (user.user)
    const actualUser = user?.user || user;

    if (!validateUser(actualUser)) {
        return false;
    }

    // Check if user has required role
    let hasRequiredRole = allowedRoles.includes(actualUser.role);

    // For admin role, just check if the user has ADMIN role in their data
    // No need for additional localStorage checks since we're already in admin routes
    if (actualUser.role === USER_ROLES.ADMIN) {
        return true;
    }

    return hasRequiredRole;
};

// Route access validation function
export const validateRouteAccess = (currentPath: string, userRole: string | undefined, isAuthenticated: boolean): boolean => {
    if (!isAuthenticated || !userRole) {
        return false;
    }

    // Admin routes - if we're in admin path, user must be admin
    if (currentPath.startsWith('/admin')) {
        const hasAccess = userRole === USER_ROLES.ADMIN;
        return hasAccess;
    }

    // Trainer routes
    if (currentPath.startsWith('/trainer')) {
        const hasAccess = userRole === USER_ROLES.TRAINER;
        return hasAccess;
    }

    // User routes (accessible by all authenticated users)
    const hasAccess = ROUTE_ACCESS.USER_ROUTES.some(route => {
        // Handle dynamic routes with parameters
        if (route.includes(':')) {
            const routePattern = route.replace(/:[^/]+/g, '[^/]+');
            const regex = new RegExp(`^${routePattern}$`);
            return regex.test(currentPath);
        }
        // Handle wildcard routes
        if (route.includes('*')) {
            const routePattern = route.replace(/\*/g, '.*');
            const regex = new RegExp(`^${routePattern}$`);
            return regex.test(currentPath);
        }
        return route === currentPath;
    });

    return hasAccess;
};

// Get appropriate redirect path based on user role
export const getRedirectPath = (userRole: string | undefined): string => {  

    switch (userRole) {
        case USER_ROLES.ADMIN:
            return ROUTES.ADMIN_DASHBOARD;
        case USER_ROLES.TRAINER:
            return ROUTES.TRAINER_DASHBOARD;
        default:
            return ROUTES.DASHBOARD;
    }
};

// Clear authentication data
export const clearAuthData = (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

// Log unauthorized access attempt
export const logUnauthorizedAccess = (path: string, userRole: string | undefined, allowedRoles: string[]): void => {

};
