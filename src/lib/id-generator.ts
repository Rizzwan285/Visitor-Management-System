export function generateUniqueId(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generatePassNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    return `VMS-${date}-${suffix}`;
}
