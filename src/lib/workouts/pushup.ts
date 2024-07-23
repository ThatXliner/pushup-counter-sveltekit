import type { Pose } from '@tensorflow-models/pose-detection';
import type Workout from '.';

export default class Pushup implements Workout {
	private isUp: boolean;
	private pushups: number;
	constructor() {
		this.isUp = true;
		this.pushups = 0;
	}
	public onFrame(poses: Pose[]): string {
		const keypoints = poses[0].keypoints;
		const left_shoulder = keypoints.find((keypoint) => keypoint.name === 'left_shoulder');
		const right_shoulder = keypoints.find((keypoint) => keypoint.name === 'right_shoulder');
		const left_elbow = keypoints.find((keypoint) => keypoint.name === 'left_elbow');
		const right_elbow = keypoints.find((keypoint) => keypoint.name === 'right_elbow');
		const left_hip = keypoints.find((keypoint) => keypoint.name === 'left_hip');
		const right_hip = keypoints.find((keypoint) => keypoint.name === 'right_hip');

		const left_shoulder_to_elbow = Math.round(
			Math.sqrt((left_shoulder.x - left_elbow.x) ** 2 + (left_shoulder.y - left_elbow.y) ** 2)
		);
		const right_shoulder_to_elbow = Math.round(
			Math.sqrt((right_shoulder.x - right_elbow.x) ** 2 + (right_shoulder.y - right_elbow.y) ** 2)
		);
		const log = { left_shoulder_to_elbow, right_shoulder_to_elbow };

		// calibrate these values per person
		const hips_visible = left_hip.score > 0.5 && right_hip.score > 0.5;
		if (!hips_visible && left_shoulder_to_elbow < 40 && right_shoulder_to_elbow < 40) {
			this.isUp = false;
		}
		if (hips_visible && left_shoulder_to_elbow > 50 && right_shoulder_to_elbow > 50) {
			if (!this.isUp) {
				this.pushups++;
			}
			this.isUp = true;
		}
		console.log(left_shoulder_to_elbow, right_shoulder_to_elbow);
		return `Pushups: ${this.pushups}\n${JSON.stringify(log)}`;
	}
}
