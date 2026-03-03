export const FeatureFlags = {
    approvalRequiredStudentGuest:
        process.env.APPROVAL_REQUIRED_STUDENT_GUEST === 'true',
    approvalRequiredEmployeeGuest:
        process.env.APPROVAL_REQUIRED_EMPLOYEE_GUEST === 'true',
    approvalRequiredOfficial:
        process.env.APPROVAL_REQUIRED_OFFICIAL === 'true',
};
