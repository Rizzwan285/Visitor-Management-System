export const emailConfig = {
    from: process.env.EMAIL_FROM || 'noreply@localhost',
    replyTo: process.env.EMAIL_REPLY_TO || undefined,

    // CC recipients for specific pass types
    assistantWardenEmails: (process.env.ASSISTANT_WARDEN_EMAIL || '')
        .split(',')
        .filter(Boolean),
    deptHeadEmails: (process.env.DEPT_HEAD_EMAILS || '')
        .split(',')
        .filter(Boolean),
};
