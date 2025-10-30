'use client';

import React, { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

type CameraClientProps = {
	open: boolean; // カメラUIを表示するかどうか（親から制御）
	onClose: () => void;
	onCapture: (dataUrl: string) => void;
};

export default function CameraClient({ open, onClose, onCapture }: CameraClientProps) {
	const webcamRef = useRef<Webcam>(null);

	const handleTakePhoto = useCallback(() => {
		if (!webcamRef.current) return;
		const dataUrl = webcamRef.current.getScreenshot(); // "data:image/jpeg;base64,..."
		if (dataUrl) {
			onCapture(dataUrl);
			// 撮影後に閉じるならここで onClose() を呼んでも良い
			// onClose();
		}
	}, [onCapture]);

	if (!open) {
		// 親がopen=falseのときは何も描画しない
		return null;
	}

	return (
		<section className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4 flex flex-col gap-4 mt-6">
			<div className="w-full border rounded overflow-hidden bg-black">
				<Webcam
					ref={webcamRef}
					audio={false}
					screenshotFormat="image/jpeg"
					videoConstraints={{
						facingMode: 'environment', // 背面カメラ要求
					}}
					style={{ width: '100%', height: 'auto' }}
				/>
			</div>

			<div className="flex gap-2 justify-center">
				<button
					onClick={handleTakePhoto}
					className="px-4 py-2 rounded bg-green-600 text-white text-lg hover:bg-green-700"
				>
					撮影
				</button>

				<button
					onClick={onClose}
					className="px-4 py-2 rounded bg-red-600 text-white text-lg hover:bg-red-700"
				>
					閉じる
				</button>
			</div>
		</section>
	);
}
