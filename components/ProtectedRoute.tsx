
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { KullaniciRol } from '../types';
import { logger } from '../utils/logger';

interface ProtectedRouteProps {
    userRole: KullaniciRol;
    allowedRoles?: KullaniciRol[];
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ userRole, allowedRoles, children }) => {
    const location = ReactRouterDOM.useLocation();

    logger.debug('ProtectedRoute Check:', {
        currentPath: location.pathname,
        userRole,
        allowedRoles,
        isYonetici: userRole === KullaniciRol.YONETICI,
        hasAllowedRoles: allowedRoles && allowedRoles.length > 0,
        isRoleAllowed: allowedRoles ? allowedRoles.includes(userRole) : 'No roles defined'
    });
    
    // Special debug for specific routes (only in development)
    if (location.pathname === '/kumbaralar') {
        logger.debug('Kumbaralar ProtectedRoute:', {
            path: location.pathname,
            userRole,
            allowedRoles,
            isYonetici: userRole === KullaniciRol.YONETICI,
            willGrantAccess: userRole === KullaniciRol.YONETICI || !allowedRoles || allowedRoles.length === 0 || (allowedRoles && allowedRoles.includes(userRole))
        });
    }

    // Yönetici has access to everything.
    if (userRole === KullaniciRol.YONETICI) {
        logger.debug('Access granted: User is YONETICI');
        return children;
    }

    // If no roles are specified, the route is public to logged-in users.
    if (!allowedRoles || allowedRoles.length === 0) {
        logger.debug('Access granted: No role restrictions');
        return children;
    }

    // Check if the user's role is in the allowed list.
    const hasAccess = allowedRoles.includes(userRole);

    if (!hasAccess) {
        // Redirect them to the /access-denied page.
        // Pass the current location so we can tell the user where they were trying to go.
        logger.debug('Access denied: User role not in allowed roles');
        return <ReactRouterDOM.Navigate to="/access-denied" state={{ from: location }} replace />;
    }

    logger.debug('Access granted: User role is in allowed roles');
    return children;
};

export default ProtectedRoute;