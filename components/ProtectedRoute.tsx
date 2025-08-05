
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { KullaniciRol } from '../types';

interface ProtectedRouteProps {
    userRole: KullaniciRol;
    allowedRoles?: KullaniciRol[];
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ userRole, allowedRoles, children }) => {
    const location = ReactRouterDOM.useLocation();

    // Yönetici has access to everything.
    if (userRole === KullaniciRol.YONETICI) {
        return children;
    }

    // If no roles are specified, the route is public to logged-in users.
    if (!allowedRoles || allowedRoles.length === 0) {
        return children;
    }

    // Check if the user's role is in the allowed list.
    const hasAccess = allowedRoles.includes(userRole);

    if (!hasAccess) {
        // Redirect them to the /access-denied page.
        // Pass the current location so we can tell the user where they were trying to go.
        return <ReactRouterDOM.Navigate to="/access-denied" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;