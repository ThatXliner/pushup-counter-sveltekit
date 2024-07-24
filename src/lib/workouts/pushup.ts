import type { Pose } from '@tensorflow-models/pose-detection';
import Workout, { DEFAULT_BLAZEPOSE_CONFIG, type ModelConfigurations } from '.';

export default class Pushup extends Workout {
	private isUp: boolean;
	private pushups: number;
	private average_left_wrist: { x: number; y: number } | null;
	private average_right_wrist: { x: number; y: number } | null;
	private iterations: number;
	constructor() {
		super();
		this.isUp = true;
		this.iterations = 0;
		this.pushups = 0;
		this.average_left_wrist = null;
		this.average_right_wrist = null;
	}
	public onFrame(poses: Pose[]): string {
		this.iterations++;
		const keypoints = poses[0].keypoints;
		const left_shoulder = keypoints.find((keypoint) => keypoint.name === 'left_shoulder')!;
		const right_shoulder = keypoints.find((keypoint) => keypoint.name === 'right_shoulder')!;
		const left_elbow = keypoints.find((keypoint) => keypoint.name === 'left_elbow')!;
		const right_elbow = keypoints.find((keypoint) => keypoint.name === 'right_elbow')!;
		const left_wrist = keypoints.find((keypoint) => keypoint.name === 'left_wrist')!;
		const right_wrist = keypoints.find((keypoint) => keypoint.name === 'right_wrist')!;

		// keep a running average
		if (this.average_left_wrist === null) {
			this.average_left_wrist = left_wrist;
		} else {
			const distance_from_average = Math.sqrt(
				(left_wrist.x - this.average_left_wrist.x) ** 2 +
					(left_wrist.y - this.average_left_wrist.y) ** 2
			);
			this.average_left_wrist.x += (left_wrist.x - this.average_left_wrist.x) / this.iterations;
			this.average_left_wrist.y += (left_wrist.y - this.average_left_wrist.y) / this.iterations;
			if (distance_from_average > 10) {
				return "Frame rejected; don't move your wrist";
			}
		}
		if (this.average_right_wrist === null) {
			this.average_right_wrist = right_wrist;
		} else {
			const distance_from_average = Math.sqrt(
				(left_wrist.x - this.average_left_wrist.x) ** 2 +
					(left_wrist.y - this.average_left_wrist.y) ** 2
			);
			this.average_right_wrist.x += (right_wrist.x - this.average_right_wrist.x) / this.iterations;
			this.average_right_wrist.y += (right_wrist.y - this.average_right_wrist.y) / this.iterations;
			if (distance_from_average > 10) {
				return "Frame rejected; don't move your wrist";
			}
		}
		const nose = keypoints.find((keypoint) => keypoint.name === 'nose')!;

		const nose_to_left_wrist = Math.sqrt(
			(nose.x - left_wrist.x) ** 2 + (nose.y - left_wrist.y) ** 2
		);
		const nose_to_right_wrist = Math.sqrt(
			(nose.x - right_wrist.x) ** 2 + (nose.y - right_wrist.y) ** 2
		);

		const left_shoulder_to_elbow = Math.sqrt(
			(left_shoulder.x - left_elbow.x) ** 2 + (left_shoulder.y - left_elbow.y) ** 2
		);
		const right_shoulder_to_elbow = Math.sqrt(
			(right_shoulder.x - right_elbow.x) ** 2 + (right_shoulder.y - right_elbow.y) ** 2
		);
		const left_elbow_to_wrist = Math.sqrt(
			(left_elbow.x - left_wrist.x) ** 2 + (left_elbow.y - left_wrist.y) ** 2
		);
		const right_elbow_to_wrist = Math.sqrt(
			(right_elbow.x - right_wrist.x) ** 2 + (right_elbow.y - right_wrist.y) ** 2
		);
		const left_wrist_to_shoulder = Math.sqrt(
			(left_wrist.x - left_shoulder.x) ** 2 + (left_wrist.y - left_shoulder.y) ** 2
		);
		const right_wrist_to_shoulder = Math.sqrt(
			(right_wrist.x - right_shoulder.x) ** 2 + (right_wrist.y - right_shoulder.y) ** 2
		);
		// Using the law of cosines, we can calculate the elbow angle
		const left_elbow_angle = Math.acos(
			(left_wrist_to_shoulder ** 2 - left_elbow_to_wrist ** 2 - left_shoulder_to_elbow ** 2) /
				(-2 * left_elbow_to_wrist * left_shoulder_to_elbow)
		);
		const right_elbow_angle = Math.acos(
			(right_wrist_to_shoulder ** 2 - right_elbow_to_wrist ** 2 - right_shoulder_to_elbow ** 2) /
				(-2 * right_elbow_to_wrist * right_shoulder_to_elbow)
		);
		const are_elbows_bent =
			left_elbow_angle * (180 / Math.PI) < 90 && right_elbow_angle * (180 / Math.PI) < 90;
		// XXX: Tuned to my personal arm lengths
		const chest_close_to_ground = nose_to_right_wrist < 130 && nose_to_left_wrist < 130;

		const isDown = are_elbows_bent && chest_close_to_ground;
		if (isDown) {
			this.isUp = false;
		}
		if (!isDown && !this.isUp) {
			this.isUp = true;
			this.pushups++;
		}
		// console.log(left_shoulder_to_elbow, right_shoulder_to_elbow);
		return `Pushups: ${this.pushups}`;
	}
}
