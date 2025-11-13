'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf';
import CameraClient from './components/CameraClient';

// Mapboxのアクセストークンを設定
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function Home() {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

	const lng = 135.4959;
	const lat = 34.7024;
	// const lng = 135.4691;
	// const lat = 34.7128;
	const zoom = 14;
	const [isInRange, setIsInRange] = useState(false);
	const [locationError, setLocationError] = useState<string>('');
	const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
	const watchIdRef = useRef<number | null>(null);

	const [showCamera, setShowCamera] = useState(false);
	const [capturedImg, setCapturedImg] = useState<string | null>(null);
	const radiusInKm = 1; //1km

	useEffect(() => {
		if (!map.current && mapContainer.current) {
			// マップの初期化
			map.current = new mapboxgl.Map({
				container: mapContainer.current,
				style: 'mapbox://styles/mapbox/streets-v12',
				center: [lng, lat],
				zoom: zoom,
			});

			// マップがロードされた後の処理
			map.current.on('load', () => {
				// 目的地を中心とした円を描画+
				const center = [lng, lat];
				const circle = turf.circle(center, radiusInKm, {
					steps: 64,
					units: 'kilometers',
				});

				// 目的地のマーカーを追加
				const destinationMarker = new mapboxgl.Marker({
					color: '#FF0000',
				})
					.setLngLat([lng, lat])
					.addTo(map.current!);

				// 円のレイヤーを追加
				map.current?.addSource('circle', {
					type: 'geojson',
					data: circle,
				});

				map.current?.addLayer({
					id: 'circle-fill',
					type: 'fill',
					source: 'circle',
					paint: {
						'fill-color': '#4264fb',
						'fill-opacity': 0.2,
					},
				});

				map.current?.addLayer({
					id: 'circle-border',
					type: 'line',
					source: 'circle',
					paint: {
						'line-color': '#4264fb',
						'line-width': 2,
					},
				});

				// ユーザーの位置を更新する関数
				const updateUserLocation = (location: [number, number]) => {
					setUserLocation(location);

					// ユーザーが円内にいるかチェック
					const point = turf.point(location);
					const isInside = turf.booleanPointInPolygon(point, circle);
					setIsInRange(isInside);

					// 既存のマーカーを更新または作成
					const el = document.createElement('div');
					el.className = 'user-marker';
					el.style.backgroundColor = isInside ? '#32CD32' : '#FF4500';
					el.style.width = '20px';
					el.style.height = '20px';
					el.style.borderRadius = '50%';
					el.style.border = '2px solid white';
					el.style.boxShadow = '0 0 2px rgba(0,0,0,0.3)';

					if (userMarkerRef.current) {
						userMarkerRef.current.setLngLat(location);
					} else {
						userMarkerRef.current = new mapboxgl.Marker(el).setLngLat(location).addTo(map.current!);
					}

					// 現在位置に地図を移動（スムーズな追従）
					map.current?.panTo(location, {
						duration: 500,
					});
				};

				// 位置情報を取得する関数
				const getLocation = () => {
					if (!navigator.geolocation) {
						setLocationError('お使いのブラウザは位置情報をサポートしていません。');
						return;
					}

					const options = {
						enableHighAccuracy: false,
						timeout: 30000,
						maximumAge: 5000,
					};

					// 最初の位置情報を取得
					navigator.geolocation.getCurrentPosition(
						(position) => {
							const location: [number, number] = [
								position.coords.longitude,
								position.coords.latitude,
							];
							updateUserLocation(location);
							setLocationError('');
						},
						(error) => {
							console.warn('位置情報の取得に失敗:', error);
							setLocationError(
								'ブラウザの位置情報取得に失敗しました。位置情報の使用を許可してください。',
							);
						},
						options,
					);

					// 位置情報の変更を監視
					const watchId = navigator.geolocation.watchPosition(
						(position) => {
							const location: [number, number] = [
								position.coords.longitude,
								position.coords.latitude,
							];
							updateUserLocation(location);
						},
						(error) => {
							console.warn('位置情報の監視に失敗:', error);
						},
						options,
					);

					// watchIdを返して、必要に応じてクリーンアップできるようにする
					return watchId;
				};

				// 位置情報の取得を開始
				const watchId = getLocation();
				if (watchId !== undefined) {
					watchIdRef.current = watchId;
				}
			});
		}

		// クリーンアップ関数
		return () => {
			if (userMarkerRef.current) {
				userMarkerRef.current.remove();
				userMarkerRef.current = null;
			}
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
			// 位置情報の監視を解除
			if (watchIdRef.current) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, []); // 依存配列を空にする

	const handlePhotoButton = () => {
		if (!isInRange) return;
		setCapturedImg(null);
		setShowCamera(true);
	};

	const handleCapture = (dataUrl: string) => {
		setCapturedImg(dataUrl);
		setShowCamera(false);
	};

	const handleRetake = () => {
		setCapturedImg(null);
		setShowCamera(true);
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-100">
			<div className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-2xl font-bold text-center mb-4 text-blue-500">
					さぁ、今日はどこに行こうか
				</h1>

				<div ref={mapContainer} className="map-container" style={{ height: '500px' }} />
				<div className="mt-6 flex justify-center">
					<button
						onClick={handlePhotoButton}
						className={`px-8 py-3 rounded-lg text-white text-lg transition-all ${
							isInRange
								? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
								: 'bg-gray-400 cursor-not-allowed'
						}`}
						disabled={!isInRange}
					>
						{isInRange ? '撮影する' : '指定範囲外です'}
					</button>
				</div>
				<div className="mt-4 space-y-2">
					{locationError && <p className="text-center text-yellow-600">⚠️ {locationError}</p>}
					<p className="text-center text-gray-600">
						{isInRange
							? '✅ 指定範囲内にいます。撮影ボタンを押してください。'
							: '❌ 大阪駅から1km以内に移動してください。'}
					</p>
				</div>

				<CameraClient
					open={showCamera}
					onClose={() => setShowCamera(false)}
					onCapture={handleCapture}
				/>
				{capturedImg && !showCamera && (
					<div className="mt-6 border rounded p-4 bg-gray-50">
						<p className="text-center text-gray-600 mb-2 text-sm">撮影結果プレビュー</p>
						<div className="flex justify-center">
							<Image
								src={capturedImg}
								alt="captured"
								width={600}
								height={800}
								className="rounded border object-cover"
							/>
						</div>

						<div className="flex justify-center mt-4">
							<button
								onClick={handleRetake}
								className="px-6 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-lg"
							>
								撮り直す
							</button>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
