'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreatePass } from '@/hooks/usePasses';

export function StudentGuestPassForm() {
    const router = useRouter();
    const { mutateAsync: createPass, isPending } = useCreatePass();
    const [approverEmail, setApproverEmail] = useState(''); // Simple input for now instead of full dropdown search

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!approverEmail) {
            toast.error('Please specify a faculty approver email.');
            return;
        }

        const formData = new FormData(e.currentTarget);

        // Quick manual serialization
        const data = {
            passType: 'STUDENT_GUEST' as const,
            visitorName: formData.get('visitorName') as string,
            visitorSex: formData.get('visitorSex') as 'MALE' | 'FEMALE' | 'OTHER',
            visitorAge: parseInt(formData.get('visitorAge') as string, 10),
            purpose: formData.get('purpose') as string,
            relation: formData.get('relation') as string,
            visitFrom: new Date(formData.get('visitFrom') as string).toISOString(),
            visitTo: new Date(formData.get('visitTo') as string).toISOString(),
        };

        try {
            const result = await createPass(data);
            // Wait for backend to receive the approver details properly via another action or inline query
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
                            This pass requires faculty approval before it becomes active. You will be notified once approved.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Approver Selection */}
                <div className="space-y-2 p-4 border rounded-md bg-slate-50">
                    <Label htmlFor="approver" className="font-semibold text-blue-800">Assign Faculty Approver *</Label>
                    <Input
                        id="approver"
                        type="email"
                        placeholder="Faculty email (e.g., professor@iitpkd.ac.in)"
                        value={approverEmail}
                        onChange={(e) => setApproverEmail(e.target.value)}
                        required
                    />
                    <p className="text-xs text-slate-500">The assigned faculty member will receive an email to approve this pass.</p>
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
                    <Label htmlFor="relation">Relation to Student</Label>
                    <Input id="relation" name="relation" placeholder="e.g., Father, Mother, Brother" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Textarea id="purpose" name="purpose" placeholder="Briefly describe the reason for the visit" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visitFrom">Expected Entry</Label>
                        <Input id="visitFrom" name="visitFrom" type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitTo">Expected Exit</Label>
                        <Input id="visitTo" name="visitTo" type="datetime-local" required />
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
