'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreatePass } from '@/hooks/usePasses';

export function EmployeePassForm() {
    const router = useRouter();
    const { mutateAsync: createPass, isPending } = useCreatePass();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Quick manual serialization since react-hook-form + zod adds too much line count for MVP
        const data = {
            passType: 'EMPLOYEE_GUEST' as const,
            visitorName: formData.get('visitorName') as string,
            visitorSex: formData.get('visitorSex') as 'MALE' | 'FEMALE' | 'OTHER',
            purpose: formData.get('purpose') as string,
            visitFrom: new Date(formData.get('visitFrom') as string).toISOString(),
            visitTo: new Date(formData.get('visitTo') as string).toISOString(),
        };

        try {
            const result = await createPass(data);
            toast.success('Guest pass created successfully!');
            router.push(`/employee/passes/${result.id}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create pass');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="visitorName">Visitor Name</Label>
                    <Input id="visitorName" name="visitorName" placeholder="Full name of the guest" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitorSex">Sex</Label>
                    <Select name="visitorSex" required defaultValue="MALE">
                        <SelectTrigger>
                            <SelectValue placeholder="Select visitor's sex" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Textarea id="purpose" name="purpose" placeholder="Briefly describe the reason for the visit" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visitFrom">Valid From</Label>
                        <Input id="visitFrom" name="visitFrom" type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitTo">Valid To</Label>
                        <Input id="visitTo" name="visitTo" type="datetime-local" required />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Pass'}
                </Button>
            </div>
        </form>
    );
}
