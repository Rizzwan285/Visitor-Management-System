'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreatePass } from '@/hooks/usePasses';

export function StudentExitPassForm() {
    const router = useRouter();
    const { data: session } = useSession();
    const { mutateAsync: createPass, isPending } = useCreatePass();

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

        const data = {
            passType: 'STUDENT_EXIT' as const,
            visitorName: studentName, // Self
            visitorSex: 'OTHER' as const,
            purpose: formData.get('purpose') as string,
            hostName: formData.get('hostelName') as string, // Misusing hostName for mapping hostel
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
                    <Input id="studentName" value={studentName} readOnly className="bg-slate-100" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="hostelName">Hostel</Label>
                    <Select name="hostelName" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your hostel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Gargi">Gargi</SelectItem>
                            <SelectItem value="Maitreyi">Maitreyi</SelectItem>
                            <SelectItem value="Bhrigu">Bhrigu</SelectItem>
                            <SelectItem value="Charaka">Charaka</SelectItem>
                            <SelectItem value="Sushruta">Sushruta</SelectItem>
                            <SelectItem value="Gautama">Gautama</SelectItem>
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
                        <Input id="visitFrom" name="visitFrom" type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitTo">Expected Return Date & Time</Label>
                        <Input id="visitTo" name="visitTo" type="datetime-local" required />
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
