const { supabase } = require('../config/supabase');

const supabaseAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Get user data from public.users
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (dbError) {
            console.warn('User not found in public.users:', dbError.message);
        }

        // Attach user info to request
        req.userId = user.id;
        req.supabaseUser = user;
        req.user = userData || {
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name,
            last_name: user.user_metadata?.last_name,
            role: user.user_metadata?.role || 'PMR'
        };
        req.userRole = req.user.role;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - Insufficient permissions'
            });
        }
        next();
    };
};

module.exports = {
    supabaseAuth,
    requireRole
};