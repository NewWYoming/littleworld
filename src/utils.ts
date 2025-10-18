export function gettime(timestamps: number) {
	let time = timestamps
	let beijingtime = new Date((time+28800)*1000);
	return beijingtime
}
