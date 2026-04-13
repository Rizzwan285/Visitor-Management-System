'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreatePass } from '@/hooks/usePasses';
import { useState } from 'react';

export function StudentExitPassForm() {
    const router = useRouter();
    const { data: session } = useSession();
    const { mutateAsync: createPass, isPending } = useCreatePass();
    const [hostelName, setHostelName] = useState('');

    const studentName = session?.user?.name || 'Loading...';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const visitFromStr = formData.get('visitFrom') as string;
        const visitToStr = formData.get('visitTo') as string;

        const visitFrom = new Date(visitFromStr);
        const visitTo = new Date(visitToStr);

        // Client-side validation: return date must be after exit date
        if (visitTo <= visitFrom) {
            toast.error('Return date must be after the exit date.');
            return;
        }

        if (!hostelName) {
            toast.error('Please select your hostel.');
            return;
        }

        const data = {
            passType: 'STUDENT_EXIT' as const,
            visitorName: studentName,
            visitorSex: 'OTHER' as const,
            purpose: formData.get('purpose') as string,
            hostelName,
            visitFrom: visitFrom.toISOString(),
            visitTo: visitTo.toISOString(),
        };

        try {
            const result = await createPass(data);
            toast.success('Exit pass requested successfully!');
            router.push(`/student/passes/${result.id}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to request exit pass');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2 opacity-70">
                    <Label htmlFor="studentName">Student Name (Auto-filled)</Label>
                    <Input id="studentName" value={studentName} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="hostelName">Hostel</Label>
                    <Select value={hostelName} onValueChange={setHostelName} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your hostel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Malhar">Malhar</SelectItem>
                            <SelectItem value="Saveri">Saveri</SelectItem>
                            <SelectItem value="Tilang A">Tilang A</SelectItem>
                            <SelectItem value="Tilang B">Tilang B</SelectItem>
                            <SelectItem value="Brindavani">Brindavani</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose">Reason for leaving campus</Label>
                    <Textarea id="purpose" name="purpose" placeholder="e.g., Weekend trip home, Medical appointment" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                    <div className="space-y-2">
                        <Label htmlFor="visitFrom">Exit Date & Time</Label>
                        <DateTimePicker name="visitFrom" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitTo">Expected Return Date & Time</Label>
                        <DateTimePicker name="visitTo" required />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Requesting...' : 'Request Exit Pass'}
                </Button>
            </div>
        </form>
    );
}
