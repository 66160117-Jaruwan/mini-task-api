// RBAC (Role-Based Access Control) Middleware
const authorize = (roles) => {
    return (req, res, next) => {
        // ตรวจสอบว่ามี user object จาก authenticate middleware
        if (!req.user) {
            return res.status(401).json({
                error: { 
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required' 
                }
            });
        }

        // ตรวจสอบว่า role ของ user อยู่ใน roles ที่อนุญาตหรือไม่
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: { 
                    code: 'FORBIDDEN',
                    message: 'Access denied' 
                }
            });
        }

        next();
    };
};

// Rate limit configurations ตาม role
const getRateLimit = (role) => {
    switch (role) {
        case 'premium':
            return 500; // 500 req/15min
        case 'admin':
            return 1000; // 1000 req/15min
        default:
            return 100; // 100 req/15min for normal users
    }
};

module.exports = {
    authorize,
    getRateLimit
};