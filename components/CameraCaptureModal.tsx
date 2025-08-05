
import React, { useRef, useEffect, useState } from 'react';
import Modal from './Modal';

interface CameraCaptureModalProps {
    onClose: () => void;
    onCapture: (dataUrl: string) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Kamera erişimi bu tarayıcıda desteklenmiyor.');
                return;
            }

            // First, try for the environment camera (rear camera on phones)
            const environmentConstraints = { video: { facingMode: 'environment' } };
            try {
                const stream = await navigator.mediaDevices.getUserMedia(environmentConstraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                return; // Success, we're done
            } catch (err) {
                console.warn("Environment camera not found, falling back to default camera.", err);
            }
            
            // If the first attempt failed, try with any camera
            const anyCameraConstraints = { video: true };
            try {
                const stream = await navigator.mediaDevices.getUserMedia(anyCameraConstraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Kamera hatası:", err);
                setError('Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin.');
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Kimlik Tara">
            <div className="flex flex-col items-center">
                {error ? (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-zinc-900" />
                )}
                <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700 w-full flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">
                        İptal
                    </button>
                    <button onClick={handleCapture} disabled={!!error} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                        Fotoğraf Çek
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CameraCaptureModal;