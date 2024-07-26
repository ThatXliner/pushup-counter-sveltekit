import type { Pose } from '@tensorflow-models/pose-detection';
import Workout, { DEFAULT_MOVENET_CONFIG } from '.';

export default class JumpingJack extends Workout {
	private isLegsTogether: boolean;
	private jumpingJacks: number;
	private iterations: number;

	constructor() {
		super();
		this.isLegsTogether = true;
		this.iterations = 0;
		this.jumpingJacks = 0;
	}
	getModelConfigurations() {
		return {
			...DEFAULT_MOVENET_CONFIG,
			config: { ...DEFAULT_MOVENET_CONFIG.config, minPoseScore: 0.5 }
		};
	}
	public recalibrate(): void {
		this.isLegsTogether = true;
		this.iterations = 0;
	}
	public getDetectionCount(): number {
		return this.jumpingJacks;
	}
	public onFrame(poses: Pose[]): string {
		if (poses.length === 0) return 'No poses detected';
		this.iterations++;
		const keypoints = poses[0].keypoints;
		const left_ankle = keypoints.find((keypoint) => keypoint.name === 'left_ankle')!;
		const right_ankle = keypoints.find((keypoint) => keypoint.name === 'right_ankle')!;
		const left_wrist = keypoints.find((keypoint) => keypoint.name === 'left_wrist')!;
		const right_wrist = keypoints.find((keypoint) => keypoint.name === 'right_wrist')!;

		const ankle_distance = Math.sqrt(
			(left_ankle.x - right_ankle.x) ** 2 + (left_ankle.y - right_ankle.y) ** 2
		);
		const wrist_distance = Math.sqrt(
			(left_wrist.x - right_wrist.x) ** 2 + (left_wrist.y - right_wrist.y) ** 2
		);

		const are_legs_apart = ankle_distance > 0.5; // Adjust threshold as necessary
		const are_arms_up = wrist_distance > 1.0; // Adjust threshold as necessary

		const isDown = are_legs_apart && are_arms_up;
		const isUp = !are_legs_apart && !are_arms_up;

		if (isUp) {
			this.isLegsTogether = true;
		}
		if (isDown) {
			if (this.isLegsTogether) {
				this.jumpingJacks++;
			}
			this.isLegsTogether = false;
		}

		return `Jumping Jacks: ${this.jumpingJacks}`;
	}
}
