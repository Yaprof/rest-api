// Rate limit settings
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; //100 requests per IP address per minute
const rateLimitMap = new Map();


exports.default = async function rateLimit(req, res, next) {
    /* res.header("Access-Control-Allow-Origin", "https://yaprof.fr"); */
     // Rate limit system
    const ipAddress = req.ip;

    if (rateLimitMap.has(ipAddress)) {
        const requestCount = rateLimitMap.get(ipAddress);
        if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        }
        rateLimitMap.set(ipAddress, requestCount + 1);
    } else {
        rateLimitMap.set(ipAddress, 1);
    }

    setTimeout(() => {
        rateLimitMap.delete(ipAddress);
    }, RATE_LIMIT_WINDOW_MS);

    next()
}