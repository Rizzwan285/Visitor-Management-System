export const ALLOWED_DOMAINS = ['iitpkd.ac.in', 'smail.iitpkd.ac.in'];

export const WHITELISTED_EMAILS: string[] = [
    // Add official/institutional emails here
    // e.g. 'personnel@iitpkd.ac.in', 'office_cs@iitpkd.ac.in'
];

export const isAllowedEmail = (
    email: string
): { allowed: boolean; role: string | null } => {
    if (WHITELISTED_EMAILS.includes(email)) {
        return { allowed: true, role: 'OFFICIAL' };
    }

    const domain = email.split('@')[1];

    if (domain === 'smail.iitpkd.ac.in') {
        return { allowed: true, role: 'STUDENT' };
    }

    if (domain === 'iitpkd.ac.in') {
        return { allowed: true, role: 'EMPLOYEE' };
    }

    return { allowed: false, role: null };
};
