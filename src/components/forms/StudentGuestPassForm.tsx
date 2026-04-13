'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreatePass } from '@/hooks/usePasses';
import { useUsers } from '@/hooks/useUsers';

export function StudentGuestPassForm() {
    const router = useRouter();
    const { mutateAsync: createPass, isPending } = useCreatePass();
    const [approverId, setApproverId] = useState('');

    // Fetch OIC_STUDENT_SECTION users as potential approvers
    const { data: adminsData, isLoading: isLoadingAdmins } = useUsers({ role: 'OIC_STUDENT_SECTION', limit: 50 });
    const admins = adminsData?.users || [];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!approverId) {
            toast.error('Please select an OIC Student Section approver.');
            return;
        }

        const formData = new FormData(e.currentTarget);

        const data = {
            passType: 'STUDENT_GUEST' as const,
            visitorName: formData.get('visitorName') as string,
            visitorSex: formData.get('visitorSex') as 'MALE' | 'FEMALE' | 'OTHER',
            visitorAge: parseInt(formData.get('visitorAge') as string, 10),
            purpose: formData.get('purpose') as string,
            visitorRelation: formData.get('visitorRelation') as string,
            visitFrom: new Date(formData.get('visitFrom') as string).toISOString(),
            visitTo: new Date(formData.get('visitTo') as string).toISOString(),
            approverId,
        };

        try {
            await createPass(data);
            toast.success('Pass submitted for faculty approval');
            router.push('/student');
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit pass');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            This pass requires OIC Student Section approval before it becomes active. You will be notified once approved.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Approver Selection */}
                <div className="space-y-2 p-4 border rounded-md bg-background">
                    <Label htmlFor="approver" className="font-semibold text-blue-800">Assign OIC Student Section Approver *</Label>
                    <Select value={approverId} onValueChange={setApproverId} required>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingAdmins ? 'Loading approvers...' : 'Select an approver'} />
                        </SelectTrigger>
                        <SelectContent>
                            {admins.map((admin) => (
                                <SelectItem key={admin.id} value={admin.id}>
                                    {admin.name || admin.email} ({admin.email})
                                </SelectItem>
                            ))}
                            {admins.length === 0 && !isLoadingAdmins && (
                                <SelectItem value="none" disabled>No approvers available</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">The assigned OIC Student Section member will receive an email to approve this pass.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitorName">Visitor Name</Label>
                    <Input id="visitorName" name="visitorName" placeholder="Full name of the guest" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visitorAge">Age</Label>
                        <Input id="visitorAge" name="visitorAge" type="number" min="1" max="120" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitorSex">Sex</Label>
                        <Select name="visitorSex" required defaultValue="MALE">
                            <SelectTrigger>
                                <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitorRelation">Relation to Student</Label>
                    <Input id="visitorRelation" name="visitorRelation" placeholder="e.g., Father, Mother, Brother" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Textarea id="purpose" name="purpose" placeholder="Briefly describe the reason for the visit" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visitFrom">Expected Entry</Label>
                        <DateTimePicker name="visitFrom" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitTo">Expected Exit</Label>
                        <DateTimePicker name="visitTo" required />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Submitting...' : 'Submit for Approval'}
                </Button>
            </div>
        </form>
    );
}
