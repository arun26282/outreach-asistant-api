class Helper 
{
    public static validateUrl(url: string): { isValid: boolean; url?: string; error?: string } {
        if (!url || typeof url !== 'string') {
            return { isValid: false, error: 'URL parameter is required.' };
        }

        let targetUrl = url.trim().toLowerCase();

        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
        }

        try {
            const parsedUrl = new URL(targetUrl);
            if (!parsedUrl.hostname.includes('.')) {
                return { isValid: false, error: "Please provide a valid domain." };
            }
            
            // If it passes all checks, return the sanitized URL
            return { isValid: true, url: targetUrl };

        } catch (error) {
            return { 
                isValid: false, 
                error: 'Invalid URL format. Please provide a valid domain (e.g., example.com).' 
            };
        }
    }
}

export default Helper;