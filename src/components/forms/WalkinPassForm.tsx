'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreatePass } from '@/hooks/usePasses';
import { api } from '@/services/api';

export function WalkinPassForm() {
    const router = useRouter();
    const { mutateAsync: createPass, isPending } = useCreatePass();

    // Webcam state
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [idType, setIdType] = useState('AADHAR');
    const [visitorSex, setVisitorSex] = useState('MALE');

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setIsCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            toast.error('Could not access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setPhotoDataUrl(dataUrl);
                stopCamera();

                setIsUploading(true);
                try {
                    // Convert the local browser dataUrl to a FormData blob
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const formData = new FormData();
                    formData.append('photo', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));

                    // Actually upload it to our secured backend which pushes to Supabase Storage
                    const result: any = await api.upload('/api/upload/photo', formData);
                    
                    setUploadedPhotoUrl(result.url); // Sets to /api/secure-image/xxx.jpg
                    // Note: upload is now hidden silently per request
                } catch (err: any) {
                    toast.error('Failed to upload photo to storage. Let backend finalize errors.');
                    console.error('Frontend upload fail:', err);
                } finally {
                    setIsUploading(false);
                }
            }
        }
    };

    const retakePhoto = () => {
        setPhotoDataUrl(null);
        setUploadedPhotoUrl(null);
        startCamera();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!uploadedPhotoUrl) {
            toast.error('A photograph is mandatory for walk-in passes. Please capture and upload a photo.');
            return;
        }

        const formData = new FormData(e.currentTarget);

        const data = {
            passType: 'WALKIN' as const,
            visitorName: formData.get('visitorName') as string,
            visitorSex: visitorSex as 'MALE' | 'FEMALE' | 'OTHER',
            visitorAge: parseInt(formData.get('visitorAge') as string, 10),
            purpose: formData.get('purpose') as string,
            visitorMobile: formData.get('visitorMobile') as string,
            visitorIdType: idType,
            visitorIdNumber: formData.get('visitorIdNumber') as string,
            pointOfContact: formData.get('pointOfContact') as string,
            pocMobile: formData.get('pocMobile') as string,
            phoneConfirmedBy: formData.get('phoneConfirmedBy') as string,
            visitorPhotoUrl: uploadedPhotoUrl,
            visitFrom: new Date(formData.get('visitFrom') as string).toISOString(),
            visitTo: new Date(formData.get('visitTo') as string).toISOString(),
        };

        try {
            const result = await createPass(data);
            toast.success('Walk-in pass created successfully!');
            router.push(`/security/passes/${result.id}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create walk-in pass');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Photograph Section */}
            <div className="space-y-4 p-6 border rounded-lg bg-background">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" /> Visitor Photograph *
                </h3>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative w-full md:w-80 aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                        {!isCameraActive && !photoDataUrl && (
                            <div className="text-muted-foreground flex flex-col items-center">
                                <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                <span className="text-sm">No photo captured</span>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            className={`absolute inset-0 w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                        />

                        {photoDataUrl && (
                            <img
                                src={photoDataUrl}
                                alt="Captured"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex flex-col gap-3 min-w-[150px]">
                        {!isCameraActive && !photoDataUrl && (
                            <Button type="button" onClick={startCamera}>Open Camera</Button>
                        )}
                        {isCameraActive && (
                            <>
                                <Button type="button" variant="default" className="bg-green-600 hover:bg-green-700" onClick={capturePhoto} disabled={isUploading}>
                                    {isUploading ? 'Uploading...' : 'Capture Photo'}
                                </Button>
                                <Button type="button" variant="destructive" onClick={stopCamera}>Cancel Camera</Button>
                            </>
                        )}
                        {photoDataUrl && (
                            <Button type="button" variant="outline" onClick={retakePhoto} className="gap-2">
                                <RefreshCcw className="h-4 w-4" /> Retake
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Primary Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="visitorName">Visitor Name</Label>
                    <Input id="visitorName" name="visitorName" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitorMobile">Mobile Number</Label>
                    <Input id="visitorMobile" name="visitorMobile" type="tel" pattern="[0-9]{10}" placeholder="10-digit number" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitorAge">Age</Label>
                    <Input id="visitorAge" name="visitorAge" type="number" min="1" max="120" required />
                </div>

                <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select value={visitorSex} onValueChange={setVisitorSex} required>
                        <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 3. Identity Proof */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
                <div className="space-y-2">
                    <Label>ID Proof Type</Label>
                    <Select value={idType} onValueChange={setIdType} required>
                        <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AADHAR">Aadhar Card</SelectItem>
                            <SelectItem value="PAN">PAN Card</SelectItem>
                            <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                            <SelectItem value="PASSPORT">Passport</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitorIdNumber">ID Number</Label>
                    <Input id="visitorIdNumber" name="visitorIdNumber" placeholder={`Enter ${idType} number`} required />
                </div>
            </div>

            {/* 4. Visit Details */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="pointOfContact">Who are they visiting? (Point of Contact)</Label>
                        <Input id="pointOfContact" name="pointOfContact" placeholder="Name of faculty, staff, or department" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pocMobile">POC Mobile Number</Label>
                        <Input id="pocMobile" name="pocMobile" type="tel" pattern="[0-9]{10}" placeholder="10-digit number" required />
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label htmlFor="phoneConfirmedBy">Phone Confirmed By</Label>
                        <Input id="phoneConfirmedBy" name="phoneConfirmedBy" placeholder="Name of person who confirmed by phone" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Textarea id="purpose" name="purpose" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="visitFrom">Valid From</Label>
                        <DateTimePicker name="visitFrom" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitTo">Valid To</Label>
                        <DateTimePicker name="visitTo" required />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isPending || isUploading}>
                    {isPending ? 'Generating Pass...' : 'Generate Walk-in Pass'}
                </Button>
            </div>
        </form>
    );
}
