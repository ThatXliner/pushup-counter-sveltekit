import type { Pose, Keypoint } from '@tensorflow-models/pose-detection';
import Workout from '.';

export default class BicepCurl extends Workout {
  public static readonly LOWER_BOUND = 0.001;
  public static readonly UPPER_BOUND = 0.05;
  public static readonly SLOPE_CUTOFF = 10;

	private isUp: boolean;
	private count: number;
  private readonly side: string;
	constructor(side: string) {
		super();
		this.isUp = true;
		this.count = 0;
    this.side = side;
	}
	public onFrame(poses: Pose[]): string {
    if (poses.length == 0) return "No poses found";

		const keypoints = poses[0].keypoints;
		const wrist = keypoints.find((keypoint) => keypoint.name === this.side + '_wrist')!;
		const elbow = keypoints.find((keypoint) => keypoint.name === this.side + '_elbow')!;

    const change = BicepCurl.testCurl(wrist, elbow, this.isUp);
    if (change) {
      if (!this.isUp) {
        this.count++;
      }
      this.isUp = !this.isUp;
    }

		return `Curls: ${this.count}`;
	}

  public getDetectionCount(): number {
    return this.count;
  }

  public recalibrate(): void {
    this.isUp = false;
  }

  public static testCurl(wrist: Keypoint, elbow: Keypoint, state: boolean): boolean {
    if (wrist.y < elbow.y) {
      return false;
    }

    const wrist_elbow_length = (wrist.x - elbow.x) ** 2 + (wrist.y - elbow.y) ** 2;
    const slope = (elbow.y - wrist.y) / (elbow.x - wrist.x);

    if (!state) {
      if (wrist_elbow_length < BicepCurl.LOWER_BOUND) {
        return true;
      }
    } else {
      if (Math.abs(slope) > BicepCurl.SLOPE_CUTOFF && (wrist_elbow_length > BicepCurl.UPPER_BOUND)) {
        return true;
      }
    }
    return false;
  }
}
